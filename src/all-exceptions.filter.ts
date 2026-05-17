import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch() // Empty brackets means catch EVERYTHING, not just HTTP errors
  export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      // Determine status code
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      // Determine error message
      let message = 'Internal server error';
      if (exception instanceof HttpException) {
        const res = exception.getResponse();
        message = typeof res === 'object' && res !== null ? (res as any).message || JSON.stringify(res) : res;
      } else if (exception instanceof Error) {
        message = exception.message; // Catches raw system errors, Prisma errors, etc.
      }
  
      // Custom standardized JSON response structure
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: message,
      });
    }
  }