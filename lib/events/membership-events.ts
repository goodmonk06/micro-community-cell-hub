import { DomainEvent } from './index'

export interface MemberJoinedEvent extends DomainEvent {
  type: 'member.joined'
  cellId: string
  memberId: string
  membershipId: string
  role: string
  invitedBy?: string
}

export interface MemberLeftEvent extends DomainEvent {
  type: 'member.left'
  cellId: string
  memberId: string
  membershipId: string
  reason?: string
}

export interface MemberRoleChangedEvent extends DomainEvent {
  type: 'member.role_changed'
  cellId: string
  memberId: string
  membershipId: string
  previousRole: string
  newRole: string
  changedBy?: string
}

export interface MemberInvitedEvent extends DomainEvent {
  type: 'member.invited'
  cellId: string
  invitedMemberId: string
  invitedBy: string
}

export interface MemberProfileUpdatedEvent extends DomainEvent {
  type: 'member.profile_updated'
  memberId: string
  changes: Record<string, any>
}

// Helper functions
export function memberJoined(
  data: Omit<MemberJoinedEvent, 'type' | 'timestamp'>
): MemberJoinedEvent {
  return {
    type: 'member.joined',
    timestamp: new Date(),
    ...data,
  }
}

export function memberLeft(data: Omit<MemberLeftEvent, 'type' | 'timestamp'>): MemberLeftEvent {
  return {
    type: 'member.left',
    timestamp: new Date(),
    ...data,
  }
}

export function memberRoleChanged(
  data: Omit<MemberRoleChangedEvent, 'type' | 'timestamp'>
): MemberRoleChangedEvent {
  return {
    type: 'member.role_changed',
    timestamp: new Date(),
    ...data,
  }
}

export function memberInvited(
  data: Omit<MemberInvitedEvent, 'type' | 'timestamp'>
): MemberInvitedEvent {
  return {
    type: 'member.invited',
    timestamp: new Date(),
    ...data,
  }
}
