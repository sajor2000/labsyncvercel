/**
 * Simple API error classes
 * No over-engineering, just what we need
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT')
    this.name = 'RateLimitError'
  }
}

/**
 * Handle API errors in routes
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  if (error instanceof Error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}