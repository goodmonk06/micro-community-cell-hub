// Adapter registry for pluggable external integrations

import { INotificationAdapter } from './notification-adapter'
import { IProfileAdapter } from './profile-adapter'
import { IAIAdapter } from './ai-adapter'
import { IMetricsAdapter } from './metrics-adapter'
import { ICalendarAdapter } from './calendar-adapter'

export interface AdapterRegistry {
  notification?: INotificationAdapter
  profile?: IProfileAdapter
  ai?: IAIAdapter
  metrics?: IMetricsAdapter
  calendar?: ICalendarAdapter
}

class AdapterManager {
  private adapters: AdapterRegistry = {}

  register<K extends keyof AdapterRegistry>(
    type: K,
    adapter: NonNullable<AdapterRegistry[K]>
  ): void {
    this.adapters[type] = adapter
  }

  get<K extends keyof AdapterRegistry>(type: K): AdapterRegistry[K] | undefined {
    return this.adapters[type]
  }

  has(type: keyof AdapterRegistry): boolean {
    return this.adapters[type] !== undefined
  }

  clear(): void {
    this.adapters = {}
  }
}

// Singleton instance
export const adapters = new AdapterManager()

// Re-export adapter interfaces
export * from './notification-adapter'
export * from './profile-adapter'
export * from './ai-adapter'
export * from './metrics-adapter'
export * from './calendar-adapter'
