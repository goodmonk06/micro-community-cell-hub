/**
 * Domain Event System
 * Enables event-driven architecture for the cell hub
 */

import { logger } from '../logger'

// Base event interface
export interface DomainEvent {
  type: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Event handler function type
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void

// Event registry
class EventBus {
  private handlers = new Map<string, EventHandler[]>()

  /**
   * Register an event handler
   */
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }

    this.handlers.get(eventType)!.push(handler as EventHandler)

    logger.debug('Event handler registered', { eventType })

    // Return unsubscribe function
    return () => this.off(eventType, handler)
  }

  /**
   * Unregister an event handler
   */
  off<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType)
    if (!handlers) return

    const index = handlers.indexOf(handler as EventHandler)
    if (index > -1) {
      handlers.splice(index, 1)
      logger.debug('Event handler unregistered', { eventType })
    }
  }

  /**
   * Emit an event
   */
  async emit<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || []

    logger.info('Event emitted', {
      type: event.type,
      handlerCount: handlers.length,
    })

    // Execute all handlers
    const promises = handlers.map(async handler => {
      try {
        await handler(event)
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}`, error, {
          eventType: event.type,
        })
        // Don't throw - allow other handlers to run
      }
    })

    await Promise.all(promises)
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear()
    logger.debug('Event bus cleared')
  }

  /**
   * Clear handlers for a specific event type
   */
  clearType(eventType: string): void {
    this.handlers.delete(eventType)
    logger.debug('Event handlers cleared', { eventType })
  }
}

// Singleton event bus
export const eventBus = new EventBus()

// Re-export event types
export * from './cell-events'
export * from './membership-events'
export * from './session-events'
export * from './health-events'
