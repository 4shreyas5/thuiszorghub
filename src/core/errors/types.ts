export class IdentityError extends Error {
  readonly code: string;
  readonly type: "auth" | "authorization" | "permission" | "session" | "network" | "unknown";
  readonly statusCode: number;

  constructor(
    code: string,
    message: string,
    type: "auth" | "authorization" | "permission" | "session" | "network" | "unknown",
    statusCode: number = 500
  ) {
    super(message);
    this.name = "IdentityError";
    this.code = code;
    this.type = type;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends IdentityError {
  constructor(message: string = "Authentication failed", code: string = "AUTH_FAILED") {
    super(code, message, "auth", 401);
  }
}

export class AuthorizationError extends IdentityError {
  constructor(message: string = "Authorization failed", code: string = "AUTH_DENIED") {
    super(code, message, "authorization", 403);
  }
}

export class PermissionError extends IdentityError {
  constructor(message: string = "Insufficient permissions", code: string = "PERMISSION_DENIED") {
    super(code, message, "permission", 403);
  }
}

export class SessionError extends IdentityError {
  constructor(message: string = "Session error", code: string = "SESSION_ERROR") {
    super(code, message, "session", 401);
  }
}

export class NetworkError extends IdentityError {
  constructor(message: string = "Network error", code: string = "NETWORK_ERROR") {
    super(code, message, "network", 0);
  }
}

export function isIdentityError(error: unknown): error is IdentityError {
  return error instanceof IdentityError;
}
