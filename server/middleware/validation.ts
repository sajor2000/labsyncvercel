import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { handleValidationError } from "../utils/errorHandler";

export interface ValidationRequest extends Request {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

export const validateBody = (schema: ZodSchema) => {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedBody = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        handleValidationError(res, errorMessage);
        return;
      }
      handleValidationError(res, "Invalid request body");
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.validatedQuery = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        handleValidationError(res, errorMessage);
        return;
      }
      handleValidationError(res, "Invalid query parameters");
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: ValidationRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.validatedParams = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        handleValidationError(res, errorMessage);
        return;
      }
      handleValidationError(res, "Invalid parameters");
    }
  };
};

// Common parameter schemas
export const idParamSchema = {
  id: (schema: ZodSchema) => validateParams(schema),
};