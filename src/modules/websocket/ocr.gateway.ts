import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({ cors: true })
export class OcrGateway {
  @WebSocketServer()
  server!: Server;

  emitStatus(jobId: string, status: string) {
    this.server?.emit(`ocr-${jobId}`, { jobId, status });
  }
}
