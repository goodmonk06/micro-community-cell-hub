type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private context: LogContext

  constructor(context: LogContext = {}) {
    this.context = context
  }

  private formatMessage(level: LogLevel, message: string, data?: LogContext): string {
    const timestamp = new Date().toISOString()
    const ctx = { ...this.context, ...data }
    const contextStr = Object.keys(ctx).length > 0 ? JSON.stringify(ctx) : ''

    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`.trim()
  }

  debug(message: string, data?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: LogContext) {
    console.info(this.formatMessage('info', message, data))
  }

  warn(message: string, data?: LogContext) {
    console.warn(this.formatMessage('warn', message, data))
  }

  error(message: string, error?: Error | unknown, data?: LogContext) {
    const errorData = error instanceof Error
      ? { error: error.message, stack: error.stack, ...data }
      : { error, ...data }

    console.error(this.formatMessage('error', message, errorData))
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context })
  }
}

// Default logger instance
export const logger = new Logger()

// Factory function for creating contextual loggers
export function createLogger(context: LogContext): Logger {
  return new Logger(context)
}
