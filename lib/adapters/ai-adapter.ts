/**
 * AI Adapter Interface
 * Integrate with AI services for recommendations, content generation, etc.
 */

export interface CellRecommendation {
  cellId: string
  score: number
  reasons: string[]
}

export interface MemberRecommendation {
  memberId: string
  score: number
  reasons: string[]
  suggestedRole?: 'MEMBER' | 'HOST' | 'COHOST'
}

export interface ContentGenerationRequest {
  type: 'cell_description' | 'welcome_message' | 'session_summary' | 'health_report'
  context: Record<string, any>
  tone?: 'formal' | 'casual' | 'friendly' | 'professional'
  maxLength?: number
}

export interface IAIAdapter {
  /**
   * Get cell recommendations for a member
   */
  recommendCellsForMember(
    memberId: string,
    options?: {
      limit?: number
      excludeCellIds?: string[]
      communityId?: string
    }
  ): Promise<CellRecommendation[]>

  /**
   * Get member recommendations for a cell
   */
  recommendMembersForCell(
    cellId: string,
    options?: {
      limit?: number
      role?: 'MEMBER' | 'HOST' | 'COHOST'
      excludeMemberIds?: string[]
    }
  ): Promise<MemberRecommendation[]>

  /**
   * Generate content using AI
   */
  generateContent(request: ContentGenerationRequest): Promise<string>

  /**
   * Extract topics/tags from text
   */
  extractTopics(text: string, limit?: number): Promise<string[]>

  /**
   * Analyze cell health and provide insights
   */
  analyzeCellHealth?(cellId: string): Promise<{
    insights: string[]
    recommendations: string[]
    riskFactors: string[]
  }>
}

/**
 * No-op implementation
 */
export class NoOpAIAdapter implements IAIAdapter {
  async recommendCellsForMember(): Promise<CellRecommendation[]> {
    console.log('[NoOp] AI: recommendCellsForMember')
    return []
  }

  async recommendMembersForCell(): Promise<MemberRecommendation[]> {
    console.log('[NoOp] AI: recommendMembersForCell')
    return []
  }

  async generateContent(request: ContentGenerationRequest): Promise<string> {
    console.log('[NoOp] AI: generateContent', request.type)
    return `[AI-generated ${request.type} would appear here]`
  }

  async extractTopics(text: string): Promise<string[]> {
    console.log('[NoOp] AI: extractTopics')
    return []
  }
}

/**
 * Mock implementation with rule-based logic
 */
export class MockAIAdapter implements IAIAdapter {
  async recommendCellsForMember(
    memberId: string,
    options?: {
      limit?: number
      excludeCellIds?: string[]
    }
  ): Promise<CellRecommendation[]> {
    // In a real implementation, this would use ML models
    // For now, return mock recommendations
    return [
      {
        cellId: 'cell-123',
        score: 0.85,
        reasons: ['Matches your interests in web development', 'Active community with 15 members'],
      },
      {
        cellId: 'cell-456',
        score: 0.72,
        reasons: ['Similar timezone', 'Beginner-friendly'],
      },
    ]
  }

  async recommendMembersForCell(
    cellId: string,
    options?: {
      limit?: number
      role?: 'MEMBER' | 'HOST' | 'COHOST'
    }
  ): Promise<MemberRecommendation[]> {
    return [
      {
        memberId: 'user-789',
        score: 0.9,
        reasons: ['Strong background in relevant topics', 'Regular participant'],
        suggestedRole: options?.role || 'MEMBER',
      },
    ]
  }

  async generateContent(request: ContentGenerationRequest): Promise<string> {
    const templates: Record<string, string> = {
      cell_description:
        'This cell brings together passionate individuals to explore and learn. Join us for engaging discussions and collaborative projects.',
      welcome_message:
        'Welcome to our community! We are excited to have you here. Feel free to introduce yourself and share what brought you to this cell.',
      session_summary:
        'Today we had a productive session covering key topics. Attendance was strong and members were highly engaged throughout.',
      health_report:
        'This cell is showing positive trends. Member engagement is consistent and session attendance remains stable.',
    }

    return templates[request.type] || 'AI-generated content'
  }

  async extractTopics(text: string, limit = 5): Promise<string[]> {
    // Simple keyword extraction (in reality, use NLP)
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
    ])
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !commonWords.has(w))

    const frequency = new Map<string, number>()
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    })

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word)
  }

  async analyzeCellHealth(cellId: string): Promise<{
    insights: string[]
    recommendations: string[]
    riskFactors: string[]
  }> {
    return {
      insights: [
        'Member engagement has been consistent over the past month',
        'Session attendance averages 75%',
        'Active hosts are providing good leadership',
      ],
      recommendations: [
        'Consider adding co-hosts to distribute responsibilities',
        'Create more structured topics to guide discussions',
        'Schedule sessions at varied times to accommodate different timezones',
      ],
      riskFactors: [
        'No sessions in the past week may indicate declining activity',
        'Only one active host could be a single point of failure',
      ],
    }
  }
}
