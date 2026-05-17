import { Module } from "@nestjs/common";
import { OcrController } from "./modules/ocr/ocr.controller";
import { QueueModule } from "./modules/queue/rabbitmq.service";
import { OcrGateway } from "./modules/websocket/ocr.gateway";
import { OcrProcessor } from "./modules/worker/ocr.processor";
import { OcrService } from "./modules/ocr/ocr.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";
import { APP_FILTER } from "@nestjs/core";
import { AllExceptionsFilter } from "./all-exceptions.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        OCR_API_URL: Joi.string().required()
      })
    })
  ],
  controllers: [OcrController],
  providers: [QueueModule, OcrGateway, OcrProcessor, OcrService, PrismaService, {
    provide: APP_FILTER,
      useClass: AllExceptionsFilter,
  }]
})
export class AppModule {}
