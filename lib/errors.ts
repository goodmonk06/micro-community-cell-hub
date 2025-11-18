import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

// Error response format
export interface ErrorResponse {
  error: {
    message: string
    code?: string
    statusCode: number
    details?: any
  }
}

// Convert various error types to AppError
export function normalizeError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return new ValidationError('Validation failed', error.errors)
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with this unique field already exists', {
          field: error.meta?.target,
        })
      case 'P2025':
        return new NotFoundError('Record')
      case 'P2003':
        return new ValidationError('Foreign key constraint failed', {
          field: error.meta?.field_name,
        })
      default:
        return new AppError('Database error', 500, error.code)
    }
  }

  // Prisma validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided to database')
  }

  // Generic Error
  if (error instanceof Error) {
    return new AppError(error.message, 500)
  }

  // Unknown error
  return new AppError('An unexpected error occurred', 500)
}

// Format error for API response
export function formatErrorResponse(error: AppError): ErrorResponse {
  return {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(error.details && { details: error.details }),
    },
  }
}
