export const ErrorCode = {
  PARSE_UNSUPPORTED_FORMAT: 'PARSE_UNSUPPORTED_FORMAT',
  PARSE_EMPTY_CONTENT: 'PARSE_EMPTY_CONTENT',
  PARSE_PDF_FAILED: 'PARSE_PDF_FAILED',
  PARSE_DOCX_FAILED: 'PARSE_DOCX_FAILED',
  EXTRACT_TIMEOUT: 'EXTRACT_TIMEOUT',
  EXTRACT_RATE_LIMITED: 'EXTRACT_RATE_LIMITED',
  EXTRACT_INVALID_RESPONSE: 'EXTRACT_INVALID_RESPONSE',
  EXTRACT_UNKNOWN: 'EXTRACT_UNKNOWN',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorCodeConfig: Record<
  ErrorCodeType,
  { status: number; retryable: boolean }
> = {
  PARSE_UNSUPPORTED_FORMAT: { status: 400, retryable: false },
  PARSE_EMPTY_CONTENT: { status: 400, retryable: false },
  PARSE_PDF_FAILED: { status: 400, retryable: false },
  PARSE_DOCX_FAILED: { status: 400, retryable: false },
  EXTRACT_TIMEOUT: { status: 422, retryable: true },
  EXTRACT_RATE_LIMITED: { status: 429, retryable: true },
  EXTRACT_INVALID_RESPONSE: { status: 422, retryable: false },
  EXTRACT_UNKNOWN: { status: 422, retryable: true },
};