import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiErrorResponse } from "../types/api-error-response.type";

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpArgumentsHost = host.switchToHttp();
    const request = httpArgumentsHost.getRequest<Request>();
    const response = httpArgumentsHost.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const exceptionResponseBody = exceptionResponse as Record<
          string,
          unknown
        >;
        message =
          (exceptionResponseBody.message as string) || exception.message;
        error = (exceptionResponseBody.error as string) || "Error";
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} failed with status ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message,
      error,
    };

    response.status(status).json(errorResponse);
  }
}
