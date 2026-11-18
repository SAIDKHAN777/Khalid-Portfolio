import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError } from './response';
import { logger } from './logger';
import { captureServerError } from './sentry';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = 'APP_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function handleApiError(error: unknown, context?: Record<string, unknown>): Response {
  // Always log full error with stack trace internally to Pino
  logger.error({ err: error, context }, 'Unhandled API error encountered');

  // Capture in Sentry
  captureServerError(error, context);

  // 1. Zod Validation Errors
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue?.message || 'Validation failed';
    return apiError(message, 'VALIDATION_ERROR', 400, error.format());
  }

  // 2. Custom AppError
  if (error instanceof AppError) {
    return apiError(error.message, error.code, error.statusCode, error.details);
  }

  // 3. Prisma Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[]) || [];
        return apiError(
          `Unique constraint violation on field(s): ${fields.join(', ') || 'unknown'}`,
          'CONFLICT_ERROR',
          409
        );
      }
      case 'P2025': {
        return apiError('The requested record was not found or has been deleted', 'NOT_FOUND', 404);
      }
      case 'P2003': {
        return apiError('Foreign key constraint violation', 'FOREIGN_KEY_ERROR', 400);
      }
      default: {
        return apiError('Database request failed', 'DATABASE_ERROR', 500);
      }
    }
  }

  // 4. Prisma Validation Errors (e.g. invalid arguments)
  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError('Invalid database query parameters', 'DB_VALIDATION_ERROR', 400);
  }

  // 5. Generic / Standard Error (Always sanitized for client security)
  const errorMessage = 'An unexpected error occurred. Please try again later.';
  return apiError(errorMessage, 'INTERNAL_SERVER_ERROR', 500);
}
