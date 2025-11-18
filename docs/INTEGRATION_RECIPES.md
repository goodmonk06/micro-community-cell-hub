# Integration Recipes

This document provides practical examples for integrating the Micro Community Cell Hub with common external systems.

## Table of Contents

- [Authentication Systems](#authentication-systems)
- [Notification Services](#notification-services)
- [AI Services](#ai-services)
- [Calendar Integration](#calendar-integration)
- [Analytics Platforms](#analytics-platforms)
- [Chat Platforms](#chat-platforms)

---

## Authentication Systems

### Auth0 Integration

```typescript
// lib/auth/auth0-provider.ts
import { Auth0Client } from '@auth0/auth0-spa-js'

export async function getMemberIdFromAuth0(token: string): Promise<string> {
  const client = new Auth0Client({
    domain: process.env.AUTH0_DOMAIN!,
    clientId: process.env.AUTH0_CLIENT_ID!,
  })

  const user = await client.getUser()
  return user.sub // Use Auth0 sub as memberId
}

// Middleware for API routes
export async function withAuth(handler: ApiHandler): ApiHandler {
  return async (req, context) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberId = await getMemberIdFromAuth0(token)
    req.memberId = memberId

    return handler(req, context)
  }
}
```

### Clerk Integration

```typescript
// lib/auth/clerk-provider.ts
import { getAuth } from '@clerk/nextjs/server'

export function getClerkMemberId(req: NextRequest): string | null {
  const { userId } = getAuth(req)
  return userId
}

// Use in API routes
export async function POST(req: NextRequest) {
  const memberId = getClerkMemberId(req)
  if (!memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use memberId in cell operations
  await prisma.cellMembership.create({
    data: {
      cellId,
      memberId,
      role: 'MEMBER',
    },
  })
}
```

---

## Notification Services

### SendGrid Email Adapter

```typescript
// lib/adapters/sendgrid-adapter.ts
import sgMail from '@sendgrid/mail'
import { INotificationAdapter, NotificationChannel } from './notification-adapter'

export class SendGridAdapter implements INotificationAdapter {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey)
  }

  async send(recipient, payload, channel) {
    if (channel !== NotificationChannel.EMAIL) {
      throw new Error('SendGrid only supports email channel')
    }

    await sgMail.send({
      to: recipient.email!,
      from: process.env.FROM_EMAIL!,
      subject: payload.subject || payload.title,
      html: this.formatEmail(payload),
    })

    return { success: true, messageId: 'sendgrid-' + Date.now() }
  }

  private formatEmail(payload) {
    return `
      <h2>${payload.title}</h2>
      <p>${payload.message}</p>
      ${payload.actionUrl ? `<a href="${payload.actionUrl}">${payload.actionLabel}</a>` : ''}
    `
  }

  getSupportedChannels() {
    return [NotificationChannel.EMAIL]
  }

  validateRecipient(recipient, channel) {
    return channel === NotificationChannel.EMAIL && !!recipient.email
  }
}

// Register adapter
import { adapters } from '@/lib/adapters'
adapters.register('notification', new SendGridAdapter(process.env.SENDGRID_API_KEY!))
```

### Twilio SMS Adapter

```typescript
// lib/adapters/twilio-adapter.ts
import twilio from 'twilio'

export class TwilioAdapter implements INotificationAdapter {
  private client

  constructor(accountSid: string, authToken: string) {
    this.client = twilio(accountSid, authToken)
  }

  async send(recipient, payload, channel) {
    if (channel !== NotificationChannel.SMS) {
      throw new Error('Twilio SMS adapter only supports SMS')
    }

    const message = await this.client.messages.create({
      body: `${payload.title}\n\n${payload.message}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: recipient.phone!,
    })

    return { success: true, messageId: message.sid }
  }

  getSupportedChannels() {
    return [NotificationChannel.SMS]
  }

  validateRecipient(recipient, channel) {
    return channel === NotificationChannel.SMS && !!recipient.phone
  }
}
```

---

## AI Services

### OpenAI Integration

```typescript
// lib/adapters/openai-adapter.ts
import OpenAI from 'openai'
import { IAIAdapter } from './ai-adapter'

export class OpenAIAdapter implements IAIAdapter {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async generateContent(request) {
    const prompt = this.buildPrompt(request)

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful community management assistant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: request.maxLength || 500,
    })

    return completion.choices[0].message.content || ''
  }

  async extractTopics(text, limit = 5) {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `Extract ${limit} main topics from this text: "${text}". Return only a JSON array of topic strings.`,
        },
      ],
    })

    const content = completion.choices[0].message.content || '[]'
    return JSON.parse(content)
  }

  async recommendCellsForMember(memberId, options) {
    // Fetch member's current cells and interests
    const member = await this.fetchMemberContext(memberId)

    const prompt = `
      Based on this member's profile and interests, recommend ${options.limit || 5} community cells they should join.

      Member interests: ${member.interests}
      Current cells: ${member.currentCells}

      Return JSON array with: { cellId, score (0-1), reasons: string[] }
    `

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result.recommendations || []
  }

  private buildPrompt(request) {
    const templates = {
      cell_description: `Write a compelling 2-3 sentence description for a community cell about: ${JSON.stringify(request.context)}`,
      welcome_message: `Write a warm welcome message for new members joining: ${JSON.stringify(request.context)}`,
      session_summary: `Summarize this session: ${JSON.stringify(request.context)}`,
      health_report: `Create a health report for: ${JSON.stringify(request.context)}`,
    }

    return templates[request.type] || 'Generate content for: ' + request.type
  }

  private async fetchMemberContext(memberId: string) {
    // Fetch from your system
    return {
      interests: ['web development', 'react'],
      currentCells: ['web-dev-study', 'typescript-experts'],
    }
  }
}

// Register
adapters.register('ai', new OpenAIAdapter(process.env.OPENAI_API_KEY!))
```

---

## Calendar Integration

### Google Calendar

```typescript
// lib/adapters/google-calendar-adapter.ts
import { google } from 'googleapis'
import { ICalendarAdapter } from './calendar-adapter'

export class GoogleCalendarAdapter implements ICalendarAdapter {
  private calendar

  constructor(credentials) {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(event) {
    const result = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.title,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        attendees: event.attendees?.map(email => ({ email })),
      },
    })

    return {
      id: result.data.id!,
      url: result.data.htmlLink,
    }
  }

  async updateEvent(eventId, updates) {
    await this.calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: updates.title,
        description: updates.description,
        start: updates.startTime ? { dateTime: updates.startTime.toISOString() } : undefined,
        end: updates.endTime ? { dateTime: updates.endTime.toISOString() } : undefined,
      },
    })

    return true
  }

  async deleteEvent(eventId) {
    await this.calendar.events.delete({
      calendarId: 'primary',
      eventId,
    })

    return true
  }
}
```

---

## Analytics Platforms

### Datadog Metrics

```typescript
// lib/adapters/datadog-adapter.ts
import { StatsD } from 'hot-shots'
import { IMetricsAdapter } from './metrics-adapter'

export class DatadogAdapter implements IMetricsAdapter {
  private statsd

  constructor() {
    this.statsd = new StatsD({
      host: process.env.DD_AGENT_HOST || 'localhost',
      port: 8125,
      prefix: 'cellhub.',
    })
  }

  async record(metric) {
    const tags = metric.labels
      ? Object.entries(metric.labels).map(([k, v]) => `${k}:${v}`)
      : []

    switch (metric.type) {
      case 'counter':
        this.statsd.increment(metric.name, metric.value, tags)
        break
      case 'gauge':
        this.statsd.gauge(metric.name, metric.value, tags)
        break
      case 'histogram':
        this.statsd.histogram(metric.name, metric.value, tags)
        break
    }
  }

  async increment(name, labels) {
    const tags = labels ? Object.entries(labels).map(([k, v]) => `${k}:${v}`) : []
    this.statsd.increment(name, 1, tags)
  }

  async gauge(name, value, labels) {
    const tags = labels ? Object.entries(labels).map(([k, v]) => `${k}:${v}`) : []
    this.statsd.gauge(name, value, tags)
  }

  async histogram(name, value, labels) {
    const tags = labels ? Object.entries(labels).map(([k, v]) => `${k}:${v}`) : []
    this.statsd.histogram(name, value, tags)
  }

  async recordBatch(metrics) {
    for (const metric of metrics) {
      await this.record(metric)
    }
  }
}

// Register
adapters.register('metrics', new DatadogAdapter())
```

---

## Chat Platforms

### Discord Integration

```typescript
// lib/adapters/discord-adapter.ts
import { Client, IntentsBitField } from 'discord.js'

export class DiscordNotificationAdapter {
  private client: Client

  constructor(token: string) {
    this.client = new Client({
      intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
    })

    this.client.login(token)
  }

  async send(recipient, payload, channel) {
    if (channel !== NotificationChannel.DISCORD) {
      throw new Error('This adapter only supports Discord')
    }

    const user = await this.client.users.fetch(recipient.discordId!)

    await user.send({
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: 0x5865f2, // Discord blurple
          timestamp: new Date().toISOString(),
          fields: payload.actionUrl
            ? [
                {
                  name: 'Action',
                  value: `[${payload.actionLabel || 'Click here'}](${payload.actionUrl})`,
                },
              ]
            : [],
        },
      ],
    })

    return { success: true }
  }

  getSupportedChannels() {
    return [NotificationChannel.DISCORD]
  }

  validateRecipient(recipient, channel) {
    return channel === NotificationChannel.DISCORD && !!recipient.discordId
  }
}

// Link cells to Discord channels
export async function createCellChannel(cellId: string, guildId: string) {
  const cell = await prisma.cell.findUnique({ where: { id: cellId } })
  if (!cell) return

  const guild = await client.guilds.fetch(guildId)
  const channel = await guild.channels.create({
    name: cell.key,
    type: ChannelType.GuildText,
    topic: cell.descriptionMarkdown || cell.name,
  })

  // Store channel ID in cell metadata
  await prisma.cell.update({
    where: { id: cellId },
    data: {
      // Add discordChannelId to schema or use metadataJson
    },
  })
}
```

### Slack Integration

```typescript
// lib/adapters/slack-adapter.ts
import { WebClient } from '@slack/web-api'

export class SlackNotificationAdapter {
  private client: WebClient

  constructor(token: string) {
    this.client = new WebClient(token)
  }

  async send(recipient, payload, channel) {
    if (channel !== NotificationChannel.SLACK) {
      throw new Error('This adapter only supports Slack')
    }

    await this.client.chat.postMessage({
      channel: recipient.slackId!,
      text: payload.title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: payload.title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        ...(payload.actionUrl
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: payload.actionLabel || 'View',
                    },
                    url: payload.actionUrl,
                  },
                ],
              },
            ]
          : []),
      ],
    })

    return { success: true }
  }

  getSupportedChannels() {
    return [NotificationChannel.SLACK]
  }

  validateRecipient(recipient, channel) {
    return channel === NotificationChannel.SLACK && !!recipient.slackId
  }
}
```

---

## Event System Integration

### Webhook Notifications

Listen to domain events and send webhooks:

```typescript
// lib/webhooks/webhook-handler.ts
import { eventBus } from '@/lib/events'

export function setupWebhooks() {
  // Cell events
  eventBus.on('cell.created', async event => {
    await fetch(process.env.WEBHOOK_URL + '/cell-created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  })

  // Health events
  eventBus.on('health.status_changed', async event => {
    if (event.newStatus === 'AT_RISK' || event.newStatus === 'INACTIVE') {
      await fetch(process.env.WEBHOOK_URL + '/cell-health-alert', {
        method: 'POST',
        body: JSON.stringify(event),
      })
    }
  })

  // Member events
  eventBus.on('member.joined', async event => {
    // Send welcome notification
    const notificationAdapter = adapters.get('notification')
    if (notificationAdapter) {
      await notificationAdapter.send(
        { memberId: event.memberId },
        {
          title: 'Welcome to the cell!',
          message: `You've joined ${event.cellId}`,
        },
        NotificationChannel.EMAIL
      )
    }
  })
}
```

### Message Queue Integration

For production, use Redis or RabbitMQ:

```typescript
// lib/queue/redis-event-bus.ts
import Redis from 'ioredis'

export class RedisEventBus {
  private publisher: Redis
  private subscriber: Redis

  constructor() {
    this.publisher = new Redis(process.env.REDIS_URL)
    this.subscriber = new Redis(process.env.REDIS_URL)
  }

  async emit(event) {
    await this.publisher.publish('cellhub:events', JSON.stringify(event))
  }

  on(eventType, handler) {
    this.subscriber.subscribe(`cellhub:${eventType}`)
    this.subscriber.on('message', (channel, message) => {
      if (channel === `cellhub:${eventType}`) {
        const event = JSON.parse(message)
        handler(event)
      }
    })
  }
}
```

---

## Summary

These recipes provide starting points for common integrations. Key principles:

1. **Use Adapters**: Abstract external systems behind interfaces
2. **Leverage Events**: React to domain events for loosely coupled integrations
3. **Environment Config**: Keep credentials in environment variables
4. **Error Handling**: Gracefully handle integration failures
5. **Testing**: Use mock adapters for testing

For more examples, see the `/examples` directory (coming soon) or check the test files.
