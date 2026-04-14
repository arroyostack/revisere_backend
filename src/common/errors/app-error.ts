import { HttpException } from '@nestjs/common';
import { ErrorCode, ErrorCodeType, ErrorCodeConfig } from './error-code';

export interface AppErrorOptions {
  context?: Record<string, unknown>;
}

export class AppError extends HttpException {
  constructor(code: ErrorCodeType, options: AppErrorOptions = {}) {
    const config = ErrorCodeConfig[code];
    const response = {
      code,
      message: getMessage(code),
      retryable: config.retryable,
      ...(options.context && { details: options.context }),
    };

    super(response, config.status);
  }
}

function getMessage(code: ErrorCodeType): string {
  const messages: Record<ErrorCodeType, string> = {
    PARSE_UNSUPPORTED_FORMAT: 'Unsupported file type. Only PDF and DOCX files are allowed.',
    PARSE_EMPTY_CONTENT: 'No extractable text found in the uploaded file.',
    PARSE_PDF_FAILED: 'Unable to parse PDF. File may be corrupted or password-protected.',
    PARSE_DOCX_FAILED: 'Unable to parse DOCX. File may be corrupted or password-protected.',
    PARSE_TIMEOUT: 'File parsing timed out. Please try with a smaller or simpler file.',
    EXTRACT_TIMEOUT: 'AI service temporarily unavailable. Please try again.',
    EXTRACT_RATE_LIMITED: 'AI service rate limit exceeded. Please wait before retrying.',
    EXTRACT_INVALID_RESPONSE: 'Unable to process contract data from AI response.',
    EXTRACT_UNKNOWN: 'An unexpected error occurred while processing the contract.',
  };

  return messages[code];
}

export function sanitizeErrorMessage(error: Error): ErrorCodeType {
  const message = error.message;

  if (message.includes('timeout')) {
    return ErrorCode.EXTRACT_TIMEOUT;
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return ErrorCode.EXTRACT_RATE_LIMITED;
  }
  if (message.includes('schema') || message.includes('validation')) {
    return ErrorCode.EXTRACT_INVALID_RESPONSE;
  }

  return ErrorCode.EXTRACT_UNKNOWN;
}
