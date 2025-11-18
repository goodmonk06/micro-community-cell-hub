/**
 * Notification Adapter Interface
 * Implement this interface to integrate with different notification providers
 * (Email, Push, Discord, Slack, etc.)
 */

export interface NotificationRecipient {
  memberId: string
  email?: string
  phone?: string
  discordId?: string
  slackId?: string
}

export interface NotificationPayload {
  subject?: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
}

export enum NotificationChannel {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  DISCORD = 'discord',
  SLACK = 'slack',
  IN_APP = 'in_app',
}

export interface SendNotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface INotificationAdapter {
  /**
   * Send a notification to a single recipient
   */
  send(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult>

  /**
   * Send a notification to multiple recipients
   */
  sendBatch(
    recipients: NotificationRecipient[],
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult[]>

  /**
   * Get supported channels for this adapter
   */
  getSupportedChannels(): NotificationChannel[]

  /**
   * Validate recipient data before sending
   */
  validateRecipient(
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ): boolean
}

/**
 * No-op implementation for testing and development
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async send(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult> {
    console.log('[NoOp] Notification send:', { recipient, payload, channel })
    return { success: true, messageId: 'noop-' + Date.now() }
  }

  async sendBatch(
    recipients: NotificationRecipient[],
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult[]> {
    console.log('[NoOp] Notification batch send:', {
      recipientCount: recipients.length,
      payload,
      channel,
    })
    return recipients.map(() => ({ success: true, messageId: 'noop-' + Date.now() }))
  }

  getSupportedChannels(): NotificationChannel[] {
    return Object.values(NotificationChannel)
  }

  validateRecipient(
    recipient: NotificationRecipient,
    channel: NotificationChannel
  ): boolean {
    return true
  }
}

/**
 * Console-based implementation for development
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(
    recipient: NotificationRecipient,
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult> {
    console.log(`
╔══════════════════════════════════════════════════════╗
║ NOTIFICATION [${channel.toUpperCase()}]
╠══════════════════════════════════════════════════════╣
║ To: ${recipient.memberId}
║ Title: ${payload.title}
║ Message: ${payload.message}
${payload.actionUrl ? `║ Action: ${payload.actionLabel || 'Click here'} → ${payload.actionUrl}` : ''}
╚══════════════════════════════════════════════════════╝
    `)
    return { success: true, messageId: `console-${Date.now()}` }
  }

  async sendBatch(
    recipients: NotificationRecipient[],
    payload: NotificationPayload,
    channel: NotificationChannel
  ): Promise<SendNotificationResult[]> {
    return Promise.all(recipients.map(r => this.send(r, payload, channel)))
  }

  getSupportedChannels(): NotificationChannel[] {
    return Object.values(NotificationChannel)
  }

  validateRecipient(): boolean {
    return true
  }
}
