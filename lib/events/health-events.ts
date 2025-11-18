import { DomainEvent } from './index'

export interface HealthStatusChangedEvent extends DomainEvent {
  type: 'health.status_changed'
  cellId: string
  previousStatus: string
  newStatus: string
  previousScore?: number
  newScore: number
  reasons?: string[]
}

export interface HealthSnapshotCreatedEvent extends DomainEvent {
  type: 'health.snapshot_created'
  cellId: string
  snapshotId: string
  healthScore: number
  healthStatus: string
}

export interface InterventionTriggeredEvent extends DomainEvent {
  type: 'health.intervention_triggered'
  cellId: string
  interventionType: string
  severity: 'low' | 'medium' | 'high'
  reasons: string[]
  suggestedActions: string[]
}

export interface HealthWarningEvent extends DomainEvent {
  type: 'health.warning'
  cellId: string
  warningType: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

// Helper functions
export function healthStatusChanged(
  data: Omit<HealthStatusChangedEvent, 'type' | 'timestamp'>
): HealthStatusChangedEvent {
  return {
    type: 'health.status_changed',
    timestamp: new Date(),
    ...data,
  }
}

export function interventionTriggered(
  data: Omit<InterventionTriggeredEvent, 'type' | 'timestamp'>
): InterventionTriggeredEvent {
  return {
    type: 'health.intervention_triggered',
    timestamp: new Date(),
    ...data,
  }
}

export function healthWarning(
  data: Omit<HealthWarningEvent, 'type' | 'timestamp'>
): HealthWarningEvent {
  return {
    type: 'health.warning',
    timestamp: new Date(),
    ...data,
  }
}
