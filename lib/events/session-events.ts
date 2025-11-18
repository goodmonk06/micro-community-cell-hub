import { DomainEvent } from './index'

export interface SessionCreatedEvent extends DomainEvent {
  type: 'session.created'
  sessionId: string
  cellId: string
  sessionType: string
  scheduledTime: Date
  createdBy?: string
}

export interface SessionCompletedEvent extends DomainEvent {
  type: 'session.completed'
  sessionId: string
  cellId: string
  attendanceCount: number
  duration?: number
  notes?: string
}

export interface SessionCancelledEvent extends DomainEvent {
  type: 'session.cancelled'
  sessionId: string
  cellId: string
  reason?: string
  cancelledBy?: string
}

export interface SessionUpdatedEvent extends DomainEvent {
  type: 'session.updated'
  sessionId: string
  cellId: string
  changes: Record<string, any>
  updatedBy?: string
}

// Helper functions
export function sessionCreated(
  data: Omit<SessionCreatedEvent, 'type' | 'timestamp'>
): SessionCreatedEvent {
  return {
    type: 'session.created',
    timestamp: new Date(),
    ...data,
  }
}

export function sessionCompleted(
  data: Omit<SessionCompletedEvent, 'type' | 'timestamp'>
): SessionCompletedEvent {
  return {
    type: 'session.completed',
    timestamp: new Date(),
    ...data,
  }
}

export function sessionCancelled(
  data: Omit<SessionCancelledEvent, 'type' | 'timestamp'>
): SessionCancelledEvent {
  return {
    type: 'session.cancelled',
    timestamp: new Date(),
    ...data,
  }
}
