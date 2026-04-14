import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { WinstonLoggerService } from "../logger/winston-logger.service";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private readonly winstonLoggerService: WinstonLoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestStartTime = Date.now();
    const requestId = uuidv4();
    const requestMethod = request.method;
    const requestUrl = request.originalUrl;
    const requestIpAddress = request.ip || request.connection.remoteAddress || "unknown";
    const userAgent = request.get("user-agent") || "unknown";

    response.setHeader("X-Request-Id", requestId);

    this.winstonLoggerService.logHttpRequest(
      requestMethod,
      requestUrl,
      requestIpAddress,
      userAgent,
      requestId
    );

    response.on("finish", () => {
      const responseLatencyMs = Date.now() - requestStartTime;
      const responseStatusCode = response.statusCode;

      this.winstonLoggerService.logHttpResponse(
        requestId,
        responseStatusCode,
        responseLatencyMs
      );
    });

    next();
  }
}