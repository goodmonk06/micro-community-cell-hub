import { prisma } from '../prisma'
import { adapters } from '../adapters'
import { logger } from '../logger'

export interface CellRecommendationResult {
  cellId: string
  cell: {
    id: string
    name: string
    key: string
    descriptionMarkdown?: string | null
    themeTagsJson?: string | null
  }
  score: number
  reasons: string[]
}

export interface MemberRecommendationResult {
  memberId: string
  score: number
  reasons: string[]
  suggestedRole?: 'MEMBER' | 'HOST' | 'COHOST'
}

export class RecommendationService {
  /**
   * Recommend cells for a member to join
   */
  async recommendCellsForMember(
    memberId: string,
    options: {
      limit?: number
      excludeCellIds?: string[]
      communityId?: string
    } = {}
  ): Promise<CellRecommendationResult[]> {
    const { limit = 10, excludeCellIds = [], communityId } = options

    // Try AI adapter first
    const aiAdapter = adapters.get('ai')
    if (aiAdapter) {
      try {
        const aiRecommendations = await aiAdapter.recommendCellsForMember(memberId, {
          limit,
          excludeCellIds,
          communityId,
        })

        // Fetch full cell details
        const cellIds = aiRecommendations.map(r => r.cellId)
        const cells = await prisma.cell.findMany({
          where: { id: { in: cellIds }, status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            key: true,
            descriptionMarkdown: true,
            themeTagsJson: true,
          },
        })

        const cellMap = new Map(cells.map(c => [c.id, c]))

        return aiRecommendations
          .filter(r => cellMap.has(r.cellId))
          .map(r => ({
            cellId: r.cellId,
            cell: cellMap.get(r.cellId)!,
            score: r.score,
            reasons: r.reasons,
          }))
      } catch (error) {
        logger.warn('AI recommendations failed, falling back to rule-based', error)
      }
    }

    // Fallback: Rule-based recommendations
    return this.ruleBasedCellRecommendations(memberId, options)
  }

  /**
   * Recommend members for a cell
   */
  async recommendMembersForCell(
    cellId: string,
    options: {
      limit?: number
      role?: 'MEMBER' | 'HOST' | 'COHOST'
      excludeMemberIds?: string[]
    } = {}
  ): Promise<MemberRecommendationResult[]> {
    const { limit = 10, role, excludeMemberIds = [] } = options

    // Try AI adapter first
    const aiAdapter = adapters.get('ai')
    if (aiAdapter) {
      try {
        return await aiAdapter.recommendMembersForCell(cellId, {
          limit,
          role,
          excludeMemberIds,
        })
      } catch (error) {
        logger.warn('AI member recommendations failed, falling back to rule-based', error)
      }
    }

    // Fallback: Rule-based recommendations
    return this.ruleBasedMemberRecommendations(cellId, options)
  }

  /**
   * Find potential co-hosts for a cell
   */
  async findPotentialCoHosts(cellId: string, limit = 5): Promise<MemberRecommendationResult[]> {
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        memberships: {
          where: { leftAt: null },
          include: {
            activities: {
              orderBy: { occurredAt: 'desc' },
              take: 50,
            },
          },
        },
      },
    })

    if (!cell) return []

    // Score members based on activity and engagement
    const memberScores = cell.memberships
      .filter(m => m.role === 'MEMBER') // Only consider regular members
      .map(m => {
        const activityCount = m.activities.length
        const recentActivityCount = m.activities.filter(
          a => a.occurredAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length

        const score = activityCount * 0.5 + recentActivityCount * 2
        const engagementScore = m.engagementScore || 0

        const totalScore = (score + engagementScore) / 2

        const reasons: string[] = []
        if (recentActivityCount > 5) reasons.push('Highly active in the past month')
        if (activityCount > 20) reasons.push('Consistent long-term participation')
        if (engagementScore > 70) reasons.push('High engagement score')

        return {
          memberId: m.memberId,
          score: Math.round(totalScore),
          reasons,
          suggestedRole: 'COHOST' as const,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return memberScores
  }

  /**
   * Rule-based cell recommendations (fallback)
   */
  private async ruleBasedCellRecommendations(
    memberId: string,
    options: {
      limit?: number
      excludeCellIds?: string[]
      communityId?: string
    }
  ): Promise<CellRecommendationResult[]> {
    const { limit = 10, excludeCellIds = [], communityId } = options

    // Get member's current cells to understand interests
    const currentMemberships = await prisma.cellMembership.findMany({
      where: { memberId, leftAt: null },
      include: {
        cell: {
          select: {
            themeTagsJson: true,
          },
        },
      },
    })

    // Extract theme tags from current cells
    const currentTags = new Set<string>()
    currentMemberships.forEach(m => {
      if (m.cell.themeTagsJson) {
        try {
          const tags = JSON.parse(m.cell.themeTagsJson)
          tags.forEach((tag: string) => currentTags.add(tag.toLowerCase()))
        } catch {}
      }
    })

    // Find cells with similar themes
    const where: any = {
      status: 'ACTIVE',
      id: { notIn: [...excludeCellIds, ...currentMemberships.map(m => m.cellId)] },
    }
    if (communityId) where.communityId = communityId

    const candidateCells = await prisma.cell.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: { where: { leftAt: null } },
          },
        },
      },
      take: 50,
    })

    // Score cells
    const scored = candidateCells
      .map(cell => {
        let score = 0
        const reasons: string[] = []

        // Theme similarity
        if (cell.themeTagsJson) {
          try {
            const cellTags = JSON.parse(cell.themeTagsJson)
            const matchingTags = cellTags.filter((tag: string) =>
              currentTags.has(tag.toLowerCase())
            )
            if (matchingTags.length > 0) {
              score += matchingTags.length * 20
              reasons.push(`Shares interests: ${matchingTags.join(', ')}`)
            }
          } catch {}
        }

        // Member count (prefer moderate size)
        const memberCount = cell._count.memberships
        if (memberCount >= 5 && memberCount <= 15) {
          score += 15
          reasons.push('Optimal group size')
        }

        // Has hosts
        if (memberCount > 0) {
          score += 10
          reasons.push('Active community')
        }

        return {
          cellId: cell.id,
          cell: {
            id: cell.id,
            name: cell.name,
            key: cell.key,
            descriptionMarkdown: cell.descriptionMarkdown,
            themeTagsJson: cell.themeTagsJson,
          },
          score: score / 100, // Normalize to 0-1
          reasons,
        }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return scored
  }

  /**
   * Rule-based member recommendations (fallback)
   */
  private async ruleBasedMemberRecommendations(
    cellId: string,
    options: {
      limit?: number
      role?: 'MEMBER' | 'HOST' | 'COHOST'
      excludeMemberIds?: string[]
    }
  ): Promise<MemberRecommendationResult[]> {
    const { limit = 10, role, excludeMemberIds = [] } = options

    // Get cell info
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        memberships: {
          where: { leftAt: null },
          select: { memberId: true },
        },
      },
    })

    if (!cell) return []

    const currentMemberIds = cell.memberships.map(m => m.memberId)
    const exclude = [...excludeMemberIds, ...currentMemberIds]

    // Find members in similar cells
    const similarCells = await prisma.cell.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: cellId },
        communityId: cell.communityId,
      },
      include: {
        memberships: {
          where: {
            leftAt: null,
            memberId: { notIn: exclude },
          },
          select: {
            memberId: true,
          },
        },
      },
      take: 20,
    })

    // Count how many similar cells each member is in
    const memberCounts = new Map<string, number>()
    similarCells.forEach(c => {
      c.memberships.forEach(m => {
        memberCounts.set(m.memberId, (memberCounts.get(m.memberId) || 0) + 1)
      })
    })

    // Return top candidates
    return Array.from(memberCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([memberId, count]) => ({
        memberId,
        score: Math.min(count / 5, 1), // Normalize to 0-1
        reasons: [`Active in ${count} similar cells`],
        suggestedRole: role,
      }))
  }
}

export const recommendationService = new RecommendationService()
