export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AgentError extends AppError {
  constructor(
    message: string,
    code = "AGENT_ERROR",
    details?: Record<string, unknown>
  ) {
    super(message, code, 500, details);
    this.name = "AgentError";
  }
}

export class ToolError extends AppError {
  constructor(
    message: string,
    code = "TOOL_ERROR",
    details?: Record<string, unknown>
  ) {
    super(message, code, 500, details);
    this.name = "ToolError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string, key?: string) {
    super(
      message,
      "CONFIG_ERROR",
      500,
      key ? { key } : undefined
    );
    this.name = "ConfigError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class AIError extends AppError {
  constructor(
    message: string,
    code = "AI_ERROR",
    details?: Record<string, unknown>
  ) {
    super(message, code, 502, details);
    this.name = "AIError";
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message, "DATABASE_ERROR", 503, details);
    this.name = "DatabaseError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR");
  }
  return new AppError(String(error), "UNKNOWN_ERROR");
}
