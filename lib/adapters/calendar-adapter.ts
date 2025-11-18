/**
 * Calendar Adapter Interface
 * Sync cell sessions to external calendars (Google Calendar, Outlook, etc.)
 */

export interface CalendarEvent {
  id?: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string[] // Email addresses
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval?: number
    until?: Date
  }
  metadata?: Record<string, any>
}

export interface ICalendarAdapter {
  /**
   * Create a calendar event
   */
  createEvent(event: CalendarEvent): Promise<{ id: string; url?: string }>

  /**
   * Update an existing event
   */
  updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean>

  /**
   * Delete an event
   */
  deleteEvent(eventId: string): Promise<boolean>

  /**
   * Get event details
   */
  getEvent?(eventId: string): Promise<CalendarEvent | null>

  /**
   * List events in a date range
   */
  listEvents?(startDate: Date, endDate: Date): Promise<CalendarEvent[]>

  /**
   * Add attendees to an event
   */
  addAttendees?(eventId: string, attendees: string[]): Promise<boolean>
}

/**
 * No-op implementation
 */
export class NoOpCalendarAdapter implements ICalendarAdapter {
  async createEvent(event: CalendarEvent): Promise<{ id: string; url?: string }> {
    console.log('[NoOp] Calendar: createEvent', event.title)
    return { id: 'noop-' + Date.now() }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> {
    console.log('[NoOp] Calendar: updateEvent', eventId, updates)
    return true
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    console.log('[NoOp] Calendar: deleteEvent', eventId)
    return true
  }
}

/**
 * In-memory mock implementation for testing
 */
export class MockCalendarAdapter implements ICalendarAdapter {
  private events = new Map<string, CalendarEvent>()
  private nextId = 1

  async createEvent(event: CalendarEvent): Promise<{ id: string; url?: string }> {
    const id = `mock-event-${this.nextId++}`
    this.events.set(id, { ...event, id })

    console.log('[Mock Calendar] Created event:', id, event.title)

    return {
      id,
      url: `https://calendar.example.com/events/${id}`,
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> {
    const existing = this.events.get(eventId)
    if (!existing) return false

    this.events.set(eventId, { ...existing, ...updates })
    console.log('[Mock Calendar] Updated event:', eventId)
    return true
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const deleted = this.events.delete(eventId)
    console.log('[Mock Calendar] Deleted event:', eventId, deleted)
    return deleted
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    return this.events.get(eventId) || null
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return Array.from(this.events.values()).filter(
      event =>
        event.startTime >= startDate &&
        event.startTime <= endDate
    )
  }

  async addAttendees(eventId: string, attendees: string[]): Promise<boolean> {
    const event = this.events.get(eventId)
    if (!event) return false

    event.attendees = [...(event.attendees || []), ...attendees]
    this.events.set(eventId, event)
    console.log('[Mock Calendar] Added attendees to event:', eventId, attendees)
    return true
  }

  // Test helper
  getAllEvents(): CalendarEvent[] {
    return Array.from(this.events.values())
  }

  clear(): void {
    this.events.clear()
    this.nextId = 1
  }
}
