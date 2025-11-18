import { DomainEvent } from './index'

export interface CellCreatedEvent extends DomainEvent {
  type: 'cell.created'
  cellId: string
  communityId: string
  name: string
  createdBy?: string
  templateId?: string
}

export interface CellUpdatedEvent extends DomainEvent {
  type: 'cell.updated'
  cellId: string
  changes: Record<string, any>
  updatedBy?: string
}

export interface CellArchivedEvent extends DomainEvent {
  type: 'cell.archived'
  cellId: string
  reason?: string
  archivedBy?: string
}

export interface CellStatusChangedEvent extends DomainEvent {
  type: 'cell.status_changed'
  cellId: string
  previousStatus: string
  newStatus: string
  changedBy?: string
}

export interface CellDeletedEvent extends DomainEvent {
  type: 'cell.deleted'
  cellId: string
  deletedBy?: string
}

export interface CellConfigurationUpdatedEvent extends DomainEvent {
  type: 'cell.configuration_updated'
  cellId: string
  changes: Record<string, any>
  updatedBy?: string
}

export interface CellTopicCreatedEvent extends DomainEvent {
  type: 'cell.topic_created'
  cellId: string
  topicId: string
  topicName: string
  createdBy?: string
}

// Helper functions to create events
export function cellCreated(data: Omit<CellCreatedEvent, 'type' | 'timestamp'>): CellCreatedEvent {
  return {
    type: 'cell.created',
    timestamp: new Date(),
    ...data,
  }
}

export function cellUpdated(data: Omit<CellUpdatedEvent, 'type' | 'timestamp'>): CellUpdatedEvent {
  return {
    type: 'cell.updated',
    timestamp: new Date(),
    ...data,
  }
}

export function cellArchived(
  data: Omit<CellArchivedEvent, 'type' | 'timestamp'>
): CellArchivedEvent {
  return {
    type: 'cell.archived',
    timestamp: new Date(),
    ...data,
  }
}

export function cellStatusChanged(
  data: Omit<CellStatusChangedEvent, 'type' | 'timestamp'>
): CellStatusChangedEvent {
  return {
    type: 'cell.status_changed',
    timestamp: new Date(),
    ...data,
  }
}

export function cellDeleted(data: Omit<CellDeletedEvent, 'type' | 'timestamp'>): CellDeletedEvent {
  return {
    type: 'cell.deleted',
    timestamp: new Date(),
    ...data,
  }
}
