import { Injectable, LoggerService } from "@nestjs/common";
import * as winston from "winston";
import { LogLevel } from "./interfaces/log-level.enum";

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || LogLevel.INFO,
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: "revisere-backend" },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...rest }) => {
                const meta = Object.keys(rest).length
                  ? JSON.stringify(rest)
                  : "";
                return `${timestamp} [${level}] ${context ? `[${context}] ` : ""}${message} ${meta}`;
              },
            ),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  logHttpRequest(
    requestMethod: string,
    requestUrl: string,
    requestIpAddress: string,
    userAgent: string,
    requestId: string,
  ): void {
    this.logger.info("Incoming HTTP request", {
      context: "HTTP",
      httpRequestMethod: requestMethod,
      httpRequestUrl: requestUrl,
      httpRequestIpAddress: requestIpAddress,
      httpRequestUserAgent: userAgent,
      httpRequestId: requestId,
    });
  }

  logHttpResponse(
    requestId: string,
    responseStatusCode: number,
    responseLatencyMs: number,
  ): void {
    this.logger.info("Outgoing HTTP response", {
      context: "HTTP",
      httpRequestId: requestId,
      httpResponseStatusCode: responseStatusCode,
      httpResponseLatencyMs: responseLatencyMs,
    });
  }

  logAIOperationStart(
    operationName: string,
    providerName: string,
    modelIdentifier: string,
  ): void {
    this.logger.info("AI operation starting", {
      context: "AI",
      aiOperationName: operationName,
      aiProviderName: providerName,
      aiModelIdentifier: modelIdentifier,
    });
  }

  logAIOperationSuccess(
    operationName: string,
    providerName: string,
    latencyMs: number,
  ): void {
    this.logger.info("AI operation completed", {
      context: "AI",
      aiOperationName: operationName,
      aiProviderName: providerName,
      aiLatencyMs: latencyMs,
    });
  }

  logAIOperationFailure(
    operationName: string,
    providerName: string,
    errorMessage: string,
  ): void {
    this.logger.error("AI operation failed", {
      context: "AI",
      aiOperationName: operationName,
      aiProviderName: providerName,
      aiErrorMessage: errorMessage,
    });
  }

  logDocumentParseStart(fileName: string, mimeType: string): void {
    this.logger.info("Document parsing started", {
      context: "DocumentParsing",
      documentFileName: fileName,
      documentMimeType: mimeType,
    });
  }

  logDocumentParseSuccess(fileName: string, textLength: number): void {
    this.logger.info("Document parsing completed", {
      context: "DocumentParsing",
      documentFileName: fileName,
      documentExtractedTextLength: textLength,
    });
  }

  logDocumentParseFailure(fileName: string, errorMessage: string): void {
    this.logger.error("Document parsing failed", {
      context: "DocumentParsing",
      documentFileName: fileName,
      documentParseError: errorMessage,
    });
  }
}
