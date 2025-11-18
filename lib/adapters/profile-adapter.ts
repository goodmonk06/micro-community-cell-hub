/**
 * Profile Adapter Interface
 * Integrate with external identity/profile systems
 */

export interface ExternalProfile {
  memberId: string
  email?: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  location?: string
  timezone?: string
  socialLinks?: {
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
  }
  customFields?: Record<string, any>
}

export interface IProfileAdapter {
  /**
   * Fetch profile data for a single member
   */
  getProfile(memberId: string): Promise<ExternalProfile | null>

  /**
   * Fetch profiles for multiple members
   */
  getProfiles(memberIds: string[]): Promise<Map<string, ExternalProfile>>

  /**
   * Update profile data (if supported)
   */
  updateProfile?(memberId: string, data: Partial<ExternalProfile>): Promise<boolean>

  /**
   * Search for members by criteria
   */
  searchProfiles?(query: string, limit?: number): Promise<ExternalProfile[]>
}

/**
 * No-op implementation
 */
export class NoOpProfileAdapter implements IProfileAdapter {
  async getProfile(memberId: string): Promise<ExternalProfile | null> {
    console.log('[NoOp] Profile fetch:', memberId)
    return {
      memberId,
      displayName: `User ${memberId}`,
    }
  }

  async getProfiles(memberIds: string[]): Promise<Map<string, ExternalProfile>> {
    const profiles = new Map<string, ExternalProfile>()
    for (const id of memberIds) {
      profiles.set(id, {
        memberId: id,
        displayName: `User ${id}`,
      })
    }
    return profiles
  }
}

/**
 * Mock implementation with fake data
 */
export class MockProfileAdapter implements IProfileAdapter {
  private profiles: Map<string, ExternalProfile> = new Map()

  constructor() {
    // Add some mock profiles
    this.addMockProfile('user-001', {
      displayName: 'Alice Johnson',
      email: 'alice@example.com',
      bio: 'Full-stack developer passionate about web technologies',
      timezone: 'America/New_York',
      socialLinks: {
        github: 'https://github.com/alicejohnson',
        linkedin: 'https://linkedin.com/in/alicejohnson',
      },
    })

    this.addMockProfile('user-002', {
      displayName: 'Bob Smith',
      email: 'bob@example.com',
      bio: 'UX designer focused on accessible design',
      timezone: 'America/Los_Angeles',
    })
  }

  private addMockProfile(memberId: string, data: Partial<ExternalProfile>) {
    this.profiles.set(memberId, { memberId, ...data })
  }

  async getProfile(memberId: string): Promise<ExternalProfile | null> {
    return this.profiles.get(memberId) || null
  }

  async getProfiles(memberIds: string[]): Promise<Map<string, ExternalProfile>> {
    const result = new Map<string, ExternalProfile>()
    for (const id of memberIds) {
      const profile = this.profiles.get(id)
      if (profile) {
        result.set(id, profile)
      }
    }
    return result
  }

  async updateProfile(
    memberId: string,
    data: Partial<ExternalProfile>
  ): Promise<boolean> {
    const existing = this.profiles.get(memberId)
    if (!existing) return false

    this.profiles.set(memberId, { ...existing, ...data })
    return true
  }

  async searchProfiles(query: string, limit = 10): Promise<ExternalProfile[]> {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.profiles.values())
      .filter(
        p =>
          p.displayName?.toLowerCase().includes(lowerQuery) ||
          p.email?.toLowerCase().includes(lowerQuery) ||
          p.bio?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, limit)
  }
}
