import { Injectable, OnModuleInit } from "@nestjs/common";
import * as amqp from "amqplib";

@Injectable()
export class QueueModule implements OnModuleInit {
  private channel: any;

  async onModuleInit() {
    const conn = await amqp.connect("amqp://localhost");
    this.channel = await conn.createChannel();
    await this.channel.assertQueue("ocr_queue");
  }

  async publish(queue: string, data: any) {
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)));
  }
}
