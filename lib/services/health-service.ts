import { prisma } from '../prisma'
import { eventBus, healthStatusChanged, interventionTriggered } from '../events'
import { logger } from '../logger'
import { metrics } from '../metrics'

export interface CellHealthMetrics {
  cellId: string
  healthScore: number // 0-100
  healthStatus: 'HEALTHY' | 'WARNING' | 'AT_RISK' | 'INACTIVE'
  memberCount: number
  activeHostCount: number
  sessionCount30d: number
  avgAttendance: number
  engagementScore: number
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING'
  indicators: {
    hasActiveHost: boolean
    hasSufficientMembers: boolean
    hasRecentActivity: boolean
    hasGoodAttendance: boolean
  }
  riskFactors: string[]
  recommendations: string[]
}

export class HealthService {
  /**
   * Calculate comprehensive health metrics for a cell
   */
  async calculateCellHealth(cellId: string): Promise<CellHealthMetrics> {
    const cell = await prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        memberships: {
          where: { leftAt: null },
        },
        sessionRecords: {
          orderBy: { ts: 'desc' },
          take: 100,
        },
        configuration: true,
      },
    })

    if (!cell) {
      throw new Error(`Cell ${cellId} not found`)
    }

    // Calculate metrics
    const memberCount = cell.memberships.length
    const activeHostCount = cell.memberships.filter(
      m => m.role === 'HOST' || m.role === 'COHOST'
    ).length

    // Sessions in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentSessions = cell.sessionRecords.filter(s => s.ts >= thirtyDaysAgo)
    const sessionCount30d = recentSessions.length

    // Average attendance
    const avgAttendance =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + s.attendanceCount, 0) / recentSessions.length
        : 0

    // Engagement score (weighted combination of metrics)
    const engagementScore = this.calculateEngagementScore({
      memberCount,
      sessionCount30d,
      avgAttendance,
      activeHostCount,
    })

    // Health indicators
    const indicators = {
      hasActiveHost: activeHostCount > 0,
      hasSufficientMembers: memberCount >= (cell.configuration?.minMembersRequired || 3),
      hasRecentActivity: sessionCount30d > 0,
      hasGoodAttendance: avgAttendance >= memberCount * 0.5,
    }

    // Calculate trend direction
    const trendDirection = await this.calculateTrend(cellId)

    // Overall health score (0-100)
    const healthScore = this.calculateOverallHealthScore({
      indicators,
      sessionCount30d,
      engagementScore,
      trendDirection,
    })

    // Determine health status
    const healthStatus = this.determineHealthStatus(healthScore, indicators)

    // Risk factors and recommendations
    const { riskFactors, recommendations } = this.analyzeRisksAndRecommendations({
      indicators,
      healthStatus,
      memberCount,
      sessionCount30d,
      activeHostCount,
      cell,
    })

    // Record metrics
    metrics.gauge('cell_health_score', healthScore, { cellId })
    metrics.gauge('cell_member_count', memberCount, { cellId })
    metrics.gauge('cell_session_count_30d', sessionCount30d, { cellId })

    return {
      cellId,
      healthScore,
      healthStatus,
      memberCount,
      activeHostCount,
      sessionCount30d,
      avgAttendance,
      engagementScore,
      trendDirection,
      indicators,
      riskFactors,
      recommendations,
    }
  }

  /**
   * Create a health snapshot for historical tracking
   */
  async createHealthSnapshot(cellId: string): Promise<void> {
    const metrics = await this.calculateCellHealth(cellId)

    await prisma.cellHealthSnapshot.create({
      data: {
        cellId,
        healthScore: metrics.healthScore,
        healthStatus: metrics.healthStatus,
        memberCount: metrics.memberCount,
        activeHostCount: metrics.activeHostCount,
        sessionCount30d: metrics.sessionCount30d,
        avgAttendance: metrics.avgAttendance,
        engagementScore: metrics.engagementScore,
        trendDirection: metrics.trendDirection,
        metadataJson: JSON.stringify({
          indicators: metrics.indicators,
          riskFactors: metrics.riskFactors,
        }),
      },
    })

    logger.info('Health snapshot created', { cellId, healthScore: metrics.healthScore })
  }

  /**
   * Monitor health and trigger interventions if needed
   */
  async monitorAndIntervene(cellId: string): Promise<void> {
    const metrics = await this.calculateCellHealth(cellId)

    // Get previous status
    const previousSnapshot = await prisma.cellHealthSnapshot.findFirst({
      where: { cellId },
      orderBy: { snapshotDate: 'desc' },
    })

    // Emit status change event if status changed
    if (previousSnapshot && previousSnapshot.healthStatus !== metrics.healthStatus) {
      await eventBus.emit(
        healthStatusChanged({
          cellId,
          previousStatus: previousSnapshot.healthStatus,
          newStatus: metrics.healthStatus,
          previousScore: previousSnapshot.healthScore,
          newScore: metrics.healthScore,
          reasons: metrics.riskFactors,
        })
      )
    }

    // Trigger interventions for at-risk cells
    if (metrics.healthStatus === 'AT_RISK' || metrics.healthStatus === 'INACTIVE') {
      const severity = metrics.healthStatus === 'INACTIVE' ? 'high' : 'medium'

      await eventBus.emit(
        interventionTriggered({
          cellId,
          interventionType: 'health_decline',
          severity,
          reasons: metrics.riskFactors,
          suggestedActions: metrics.recommendations,
        })
      )

      logger.warn('Intervention triggered for cell', {
        cellId,
        healthStatus: metrics.healthStatus,
        riskFactors: metrics.riskFactors,
      })
    }
  }

  private calculateEngagementScore(params: {
    memberCount: number
    sessionCount30d: number
    avgAttendance: number
    activeHostCount: number
  }): number {
    const { memberCount, sessionCount30d, avgAttendance, activeHostCount } = params

    // Weighted formula
    const memberScore = Math.min(memberCount / 10, 1) * 25 // Max 25 points
    const sessionScore = Math.min(sessionCount30d / 4, 1) * 35 // Max 35 points (1/week)
    const attendanceScore = memberCount > 0 ? (avgAttendance / memberCount) * 30 : 0 // Max 30 points
    const hostScore = activeHostCount > 0 ? 10 : 0 // 10 points for having hosts

    return Math.round(memberScore + sessionScore + attendanceScore + hostScore)
  }

  private async calculateTrend(cellId: string): Promise<'IMPROVING' | 'STABLE' | 'DECLINING'> {
    // Get last 3 snapshots
    const snapshots = await prisma.cellHealthSnapshot.findMany({
      where: { cellId },
      orderBy: { snapshotDate: 'desc' },
      take: 3,
    })

    if (snapshots.length < 2) return 'STABLE'

    const scores = snapshots.map(s => s.healthScore).reverse()
    const trend = scores[scores.length - 1] - scores[0]

    if (trend > 10) return 'IMPROVING'
    if (trend < -10) return 'DECLINING'
    return 'STABLE'
  }

  private calculateOverallHealthScore(params: {
    indicators: Record<string, boolean>
    sessionCount30d: number
    engagementScore: number
    trendDirection: string
  }): number {
    const { indicators, sessionCount30d, engagementScore, trendDirection } = params

    // Base score from engagement
    let score = engagementScore

    // Penalties for missing indicators
    if (!indicators.hasActiveHost) score -= 15
    if (!indicators.hasSufficientMembers) score -= 10
    if (!indicators.hasRecentActivity) score -= 20
    if (!indicators.hasGoodAttendance) score -= 10

    // Bonus for improving trend
    if (trendDirection === 'IMPROVING') score += 5
    if (trendDirection === 'DECLINING') score -= 5

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private determineHealthStatus(
    score: number,
    indicators: Record<string, boolean>
  ): 'HEALTHY' | 'WARNING' | 'AT_RISK' | 'INACTIVE' {
    if (!indicators.hasRecentActivity) return 'INACTIVE'
    if (score >= 75) return 'HEALTHY'
    if (score >= 50) return 'WARNING'
    return 'AT_RISK'
  }

  private analyzeRisksAndRecommendations(params: {
    indicators: Record<string, boolean>
    healthStatus: string
    memberCount: number
    sessionCount30d: number
    activeHostCount: number
    cell: any
  }): { riskFactors: string[]; recommendations: string[] } {
    const riskFactors: string[] = []
    const recommendations: string[] = []

    if (!params.indicators.hasActiveHost) {
      riskFactors.push('No active host or co-host')
      recommendations.push('Assign at least one host to provide leadership')
    }

    if (!params.indicators.hasSufficientMembers) {
      riskFactors.push('Member count below minimum threshold')
      recommendations.push('Recruit more members or consider merging with another cell')
    }

    if (!params.indicators.hasRecentActivity) {
      riskFactors.push('No sessions in the past 30 days')
      recommendations.push('Schedule a session to re-engage members')
    }

    if (!params.indicators.hasGoodAttendance) {
      riskFactors.push('Low attendance at sessions')
      recommendations.push('Survey members about preferred meeting times and topics')
    }

    if (params.activeHostCount === 1) {
      riskFactors.push('Single host - potential single point of failure')
      recommendations.push('Appoint a co-host to share responsibilities')
    }

    if (params.sessionCount30d < 2) {
      recommendations.push('Increase session frequency to maintain engagement')
    }

    return { riskFactors, recommendations }
  }
}

export const healthService = new HealthService()
