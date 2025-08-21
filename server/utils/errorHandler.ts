import { Response } from "express";
import type { ErrorResponse } from "../types/api";
import { logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (res: Response, error: unknown, defaultMessage: string = "Internal server error"): void => {
  logger.error("API Error", { error: error instanceof Error ? error.message : String(error) });

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      statusCode: error.statusCode
    };
    res.status(error.statusCode).json(response);
    return;
  }

  if (error instanceof Error) {
    // Check for common database errors
    if (error.message.includes('not found')) {
      const response: ErrorResponse = {
        error: "Resource not found",
        message: error.message,
        statusCode: 404
      };
      res.status(404).json(response);
      return;
    }

    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      const response: ErrorResponse = {
        error: "Resource already exists",
        message: error.message,
        statusCode: 409
      };
      res.status(409).json(response);
      return;
    }

    if (error.message.includes('foreign key') || error.message.includes('constraint')) {
      const response: ErrorResponse = {
        error: "Invalid reference or constraint violation",
        message: error.message,
        statusCode: 400
      };
      res.status(400).json(response);
      return;
    }

    // Generic error response
    const response: ErrorResponse = {
      error: defaultMessage,
      message: error.message,
      statusCode: 500
    };
    res.status(500).json(response);
    return;
  }

  // Unknown error type
  const response: ErrorResponse = {
    error: defaultMessage,
    message: "An unexpected error occurred",
    statusCode: 500
  };
  res.status(500).json(response);
};

export const handleValidationError = (res: Response, message: string): void => {
  const response: ErrorResponse = {
    error: "Validation failed",
    message,
    statusCode: 400
  };
  res.status(400).json(response);
};

export const handleNotFound = (res: Response, resource: string): void => {
  const response: ErrorResponse = {
    error: `${resource} not found`,
    statusCode: 404
  };
  res.status(404).json(response);
};

export const handleUnauthorized = (res: Response, message: string = "Unauthorized"): void => {
  const response: ErrorResponse = {
    error: message,
    statusCode: 403
  };
  res.status(403).json(response);
};

export const handleConflict = (res: Response, message: string): void => {
  const response: ErrorResponse = {
    error: "Conflict",
    message,
    statusCode: 409
  };
  res.status(409).json(response);
};