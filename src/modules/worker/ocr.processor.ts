import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as amqp from "amqplib";
import axios from "axios";
import * as fs from "fs";
import FormData from "form-data";

import { OcrGateway } from "../websocket/ocr.gateway";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OcrProcessor implements OnModuleInit {
  private readonly logger = new Logger(OcrProcessor.name);
  
  // Retry Configuration Controls
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_DELAY_MS = 2000; 

  constructor(
    private readonly gateway: OcrGateway, 
    private readonly prisma: PrismaService, 
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    this.start();
  }

  async start() {
    try {
      const rabbitMqUrl = this.configService.get<string>("RABBITMQ_URL") || "amqp://localhost";
      const conn = await amqp.connect(rabbitMqUrl);
      const channel = await conn.createChannel();

      await channel.assertQueue("ocr_queue", { durable: true });
      this.logger.log("Worker connected cleanly to RabbitMQ queue: [ocr_queue]");

      channel.consume("ocr_queue", async (msg) => {
        if (!msg) return;

        const data = JSON.parse(msg.content.toString());
        const { requestId, filePath } = data;

        try {
          // 1. Mark request as PROCESSING
          await this.prisma.ocrRequest.update({
            where: { id: requestId },
            data: { status: "PROCESSING" }
          });
          this.gateway.emitStatus(requestId, "processing");

          // 2. Execute the third-party API target using the retry worker loop
          const responseData = await this.executeOcrWithRetry(filePath, requestId);

          // 3. Atomically save data and transition state to COMPLETED
          await this.prisma.$transaction([
            this.prisma.ocrResult.create({
              data: {
                requestId,
                text: JSON.stringify(responseData),
                rawResponse: responseData
              }
            }),
            this.prisma.ocrRequest.update({
              where: { id: requestId },
              data: { status: "COMPLETED" }
            })
          ]);

          // 4. Broadcast success telemetry
          this.gateway.emitStatus(requestId, "completed");
          channel.ack(msg);

        } catch (error: any) {
          this.logger.error(`Job ${requestId} encountered terminal failure after max retries: ${error.message}`);

          // 5. Update state database values to terminal FAILED state
          await this.prisma.ocrRequest.update({
            where: { id: requestId },
            data: {
              status: "FAILED",
              errorMessage: error.message
            }
          });

          this.gateway.emitStatus(requestId, "failed");
          
          // Negative acknowledge the message and drop it from the queue (requeue = false)
          channel.nack(msg, false, false);
        }
      });
    } catch (err) {
      this.logger.error("Failed to initialize system core processing consumer channel loops:", err);
    }
  }

  /**
   * Internal recursive processing loop executing calls using Exponential Backoff + Jitter
   */
  private async executeOcrWithRetry(filePath: string, requestId: string, attempt = 1): Promise<any> {
    // Create a fresh read stream for THIS specific attempt
    const fileStream = fs.createReadStream(filePath);
    
    try {
      const form = new FormData();
      form.append("files", fileStream);
  
      const apiUrl = this.configService.get<string>("OCR_API_URL");
      if (!apiUrl) {
        throw new Error("OCR_API_URL configuration token is missing inside .env variables");
      }
  
      this.logger.log(`Executing OCR processing network attempt (${attempt}/${this.MAX_RETRIES}) for task payload: ${requestId}`);
  
      // Dynamically calculate the content length for this stream
      const contentLength = await new Promise<number>((resolve, reject) => {
        form.getLength((err, length) => {
          if (err) reject(err);
          resolve(length);
        });
      });
  
      const response = await axios.post(apiUrl, form, {
        headers: {
          ...form.getHeaders(),
          "Content-Length": contentLength,
        },
        timeout: 90000 
      });
  
      return response.data;
    } catch (error: any) {
      // CRITICAL: Ensure the stream is destroyed so it doesn't leak or hang the socket
      if (fileStream && !fileStream.destroyed) {
        fileStream.destroy();
      }
  
      let detailedErrorMessage = error.message;
      if (error.response && error.response.data && error.response.data.error) {
        const apiError = error.response.data.error;
        detailedErrorMessage = `[${apiError.code || 'SERVER_ERROR'}] ${apiError.message || error.message}`;
      }
  
      // Capture system level errors like ECONNRESET clearly
      if (error.code) {
        detailedErrorMessage = `[${error.code}] ${detailedErrorMessage}`;
      }
  
      this.logger.warn(`Network payload transmission attempt #${attempt} failed for job ${requestId}. Reason: ${detailedErrorMessage}`);
  
      if (attempt >= this.MAX_RETRIES) {
        throw new Error(detailedErrorMessage);
      }
  
      this.gateway.emitStatus(requestId, `retrying_attempt_${attempt}`);
  
      const backoffDelay = this.INITIAL_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const totalDelay = backoffDelay + jitter;
  
      this.logger.log(`Backing off thread worker loop execution for ${Math.round(totalDelay)}ms before retrying request...`);
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
  
      // Recurse to next attempt loop layer
      return this.executeOcrWithRetry(filePath, requestId, attempt + 1);
    }
  }
}