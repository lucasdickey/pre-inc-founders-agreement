/**
 * Typed error taxonomy.
 *
 * Mirrors the spec's tool-level error design: a stable `errorCode` plus a
 * human-readable message and optional field/details. Tool handlers throw
 * `AppError`; the server converts it into a `CallToolResult` with
 * `isError: true` and a `structuredContent` payload the model can reason about.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "FORMATION_LOCKED"
  | "FORMATION_NOT_FOUND"
  | "AUTH_ERROR"
  | "INVALID_FOUNDER_ID"
  | "OWNERSHIP_SUM_ERROR"
  | "READINESS_FAILED"
  | "ELICITATION_UNSUPPORTED";

export class AppError extends Error {
  code: ErrorCode;
  field?: string;
  details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    opts?: { field?: string; details?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.field = opts?.field;
    this.details = opts?.details;
  }
}

export interface StructuredError {
  errorCode: ErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export function toStructuredError(e: unknown): StructuredError {
  if (e instanceof AppError) {
    return { errorCode: e.code, message: e.message, field: e.field, details: e.details };
  }
  return { errorCode: "VALIDATION_ERROR", message: e instanceof Error ? e.message : String(e) };
}
