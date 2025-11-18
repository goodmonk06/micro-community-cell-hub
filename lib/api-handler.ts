import { NextRequest, NextResponse } from 'next/server'
import { normalizeError, formatErrorResponse } from './errors'
import { logger } from './logger'
import { metrics } from './metrics'

type ApiHandler = (
  request: NextRequest,
  context?: { params: any }
) => Promise<NextResponse>

/**
 * Wraps API route handlers with error handling, logging, and metrics
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: { params: any }) => {
    const start = Date.now()
    const method = request.method
    const url = request.url

    try {
      // Log incoming request
      logger.info('API request received', {
        method,
        url,
        params: context?.params,
      })

      // Execute handler
      const response = await handler(request, context)

      // Record metrics
      const duration = Date.now() - start
      metrics.histogram('api_request_duration_ms', duration, {
        method,
        status: response.status,
      })
      metrics.counter('api_request_total', {
        method,
        status: response.status,
      })

      // Log response
      logger.info('API request completed', {
        method,
        url,
        status: response.status,
        duration,
      })

      return response
    } catch (error) {
      // Normalize error
      const appError = normalizeError(error)

      // Log error
      logger.error('API request failed', error, {
        method,
        url,
        params: context?.params,
        statusCode: appError.statusCode,
        errorCode: appError.code,
      })

      // Record error metrics
      const duration = Date.now() - start
      metrics.histogram('api_request_duration_ms', duration, {
        method,
        status: appError.statusCode,
        error: 'true',
      })
      metrics.counter('api_request_error', {
        method,
        code: appError.code || 'unknown',
      })

      // Return error response
      return NextResponse.json(
        formatErrorResponse(appError),
        { status: appError.statusCode }
      )
    }
  }
}

/**
 * Helper to create JSON responses with consistent format
 */
export function jsonResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Helper to create success responses
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Helper to parse and validate JSON body
 */
export async function parseBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}
