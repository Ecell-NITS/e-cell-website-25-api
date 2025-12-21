export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
  
      // This captures the error stack trace for debugging
      Error.captureStackTrace(this, this.constructor);
    }
  }