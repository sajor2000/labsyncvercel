/**
 * Comprehensive error handling system for API operations
 * Implements best practices for error classification and handling
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  EXTERNAL_API = 'EXTERNAL_API',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  INTERNAL = 'INTERNAL'
}

export class ApiError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>
  public readonly correlationId?: string

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    context?: Record<string, any>,
    correlationId?: string
  ) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.isOperational = true
    this.context = context
    this.correlationId = correlationId
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString()
    }
  }
}

// Specific error classes
export class ValidationError extends ApiError {
  constructor(message: string, context?: Record<string, any>, correlationId?: string) {
    super(ErrorType.VALIDATION, message, 400, context, correlationId)
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>, correlationId?: string) {
    super(ErrorType.AUTHENTICATION, message, 401, context, correlationId)
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>, correlationId?: string) {
    super(ErrorType.AUTHORIZATION, message, 403, context, correlationId)
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string, correlationId?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(ErrorType.NOT_FOUND, message, 404, { resource, id }, correlationId)
  }
}

export class RateLimitError extends ApiError {
  constructor(limit: number, window: string, correlationId?: string) {
    super(
      ErrorType.RATE_LIMIT, 
      `Rate limit exceeded: ${limit} requests per ${window}`, 
      429, 
      { limit, window },
      correlationId
    )
  }
}

export class ExternalApiError extends ApiError {
  constructor(service: string, originalError?: Error, correlationId?: string) {
    super(
      ErrorType.EXTERNAL_API,
      `${service} API error: ${originalError?.message || 'Unknown error'}`,
      502,
      { service, originalError: originalError?.message },
      correlationId
    )
  }
}

export class DatabaseError extends ApiError {
  constructor(operation: string, originalError?: Error, correlationId?: string) {
    super(
      ErrorType.DATABASE,
      `Database ${operation} failed: ${originalError?.message || 'Unknown error'}`,
      500,
      { operation, originalError: originalError?.message },
      correlationId
    )
  }
}

// Error handling utilities
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError
}

export function isOperationalError(error: any): boolean {
  if (isApiError(error)) {
    return error.isOperational
  }
  return false
}

// Convert unknown errors to ApiError
export function normalizeError(error: unknown, correlationId?: string): ApiError {
  if (isApiError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new ApiError(ErrorType.INTERNAL, error.message, 500, { originalError: error.message }, correlationId)
  }

  if (typeof error === 'string') {
    return new ApiError(ErrorType.INTERNAL, error, 500, {}, correlationId)
  }

  return new ApiError(ErrorType.INTERNAL, 'Unknown error occurred', 500, { error: JSON.stringify(error) }, correlationId)
}

// Specific error mappers for external services
export function mapOpenAIError(error: any, correlationId?: string): ApiError {
  if (error?.code === 'rate_limit_exceeded') {
    return new RateLimitError(error.requests_per_minute || 60, 'minute', correlationId)
  }
  
  if (error?.code === 'insufficient_quota') {
    return new ExternalApiError('OpenAI', new Error('Insufficient quota'), correlationId)
  }
  
  if (error?.code === 'invalid_api_key') {
    return new AuthenticationError('Invalid OpenAI API key', { service: 'OpenAI' }, correlationId)
  }

  return new ExternalApiError('OpenAI', error instanceof Error ? error : new Error(JSON.stringify(error)), correlationId)
}

export function mapSupabaseError(error: any, correlationId?: string): ApiError {
  if (error?.code === '42501') {
    return new AuthorizationError('Insufficient database permissions', { error: error.message }, correlationId)
  }

  if (error?.code === '23505') {
    return new ValidationError('Duplicate entry', { constraint: error.constraint }, correlationId)
  }

  if (error?.code === '23503') {
    return new ValidationError('Foreign key constraint violation', { constraint: error.constraint }, correlationId)
  }

  return new DatabaseError('query', error instanceof Error ? error : new Error(JSON.stringify(error)), correlationId)
}

export function mapGoogleCalendarError(error: any, correlationId?: string): ApiError {
  if (error?.code === 403) {
    if (error.message?.includes('quota')) {
      return new RateLimitError(100, 'day', correlationId)
    }
    return new AuthorizationError('Google Calendar access denied', { error: error.message }, correlationId)
  }

  if (error?.code === 401) {
    return new AuthenticationError('Google Calendar authentication failed', { error: error.message }, correlationId)
  }

  if (error?.code === 404) {
    return new NotFoundError('Google Calendar event', error?.eventId, correlationId)
  }

  return new ExternalApiError('Google Calendar', error instanceof Error ? error : new Error(JSON.stringify(error)), correlationId)
}

export function mapResendError(error: any, correlationId?: string): ApiError {
  if (error?.name === 'validation_error') {
    return new ValidationError('Invalid email data', { errors: error.errors }, correlationId)
  }

  if (error?.name === 'rate_limit_exceeded') {
    return new RateLimitError(100, 'hour', correlationId)
  }

  if (error?.name === 'api_key_invalid') {
    return new AuthenticationError('Invalid Resend API key', { service: 'Resend' }, correlationId)
  }

  return new ExternalApiError('Resend', error instanceof Error ? error : new Error(JSON.stringify(error)), correlationId)
}