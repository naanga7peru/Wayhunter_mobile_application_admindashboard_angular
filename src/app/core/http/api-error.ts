import { HttpErrorResponse } from '@angular/common/http';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    readonly correlationId?: string,
  ) {
    super(status === 0 ? 'The API could not be reached.' : 'The API request failed.');
    this.name = 'ApiError';
  }
}

export function normalizeApiError(error: unknown): unknown {
  if (!(error instanceof HttpErrorResponse)) {
    return error;
  }

  // The verified ASP.NET error envelope uses code, message and correlationId.
  // Preserve diagnostics without forwarding the raw body or server message.
  const body: unknown = error.error;
  if (
    typeof body === 'object' &&
    body !== null &&
    'code' in body &&
    typeof body.code === 'string' &&
    body.code.trim() &&
    'message' in body &&
    typeof body.message === 'string' &&
    body.message.trim() &&
    'correlationId' in body &&
    typeof body.correlationId === 'string' &&
    body.correlationId.trim()
  ) {
    return new ApiError(error.status, body.code.trim(), body.correlationId.trim());
  }

  return new ApiError(error.status);
}
