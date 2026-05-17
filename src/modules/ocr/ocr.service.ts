import { Injectable, InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QueueModule } from "../queue/rabbitmq.service";

@Injectable()
export class OcrService {
  constructor(private prisma: PrismaService, private queue: QueueModule) {}

  async createJob(file: Express.Multer.File) {
    let req;
    // 1. Try to save the initial record in the database
    try {
      req = await this.prisma.ocrRequest.create({
        data: {
          fileName: file.originalname,
          filePath: file.path,
          status: "QUEUED"
        }
      });
    } catch (dbError) {
      // If the database fails (like the P1003 error we saw earlier), catch it here
      console.error("Database failed to log OCR request:", dbError);
      
      throw new InternalServerErrorException(
        "Failed to initialize the OCR request. Please try again later."
      );
    }

    // 2. Try to dispatch the message to RabbitMQ
    try {
      await this.queue.publish("ocr_queue", {
        requestId: req.id,
        filePath: req.filePath
      });
    } catch (queueError) {
      console.error(`RabbitMQ publishing failed for Job ${req.id}:`, queueError);

      // CRITICAL STEP: The database saved the record, but RabbitMQ failed to queue it. 
      // Update the DB record status to FAILED so it's not stuck in "QUEUED" forever.
      try {
        await this.prisma.ocrRequest.update({
          where: { id: req.id },
          data: { status: "FAILED" }
        });
      } catch (updateError) {
        console.error("Failed to update status to FAILED after queue error:", updateError);
      }

      // Throw an HTTP exception indicating a service dependency failed
      throw new ServiceUnavailableException(
        "The file was uploaded, but the processing queue is currently unavailable."
      );
    }

    // 3. Return the success payload if both steps succeeded
    return { jobId: req.id, status: "QUEUED" };
  }
}