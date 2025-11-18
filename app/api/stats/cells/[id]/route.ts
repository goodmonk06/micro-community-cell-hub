import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats/cells/[id] - Get detailed stats for a specific cell
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cell = await prisma.cell.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          where: { leftAt: null },
        },
        sessionRecords: {
          orderBy: { ts: 'desc' },
        },
      },
    })

    if (!cell) {
      return NextResponse.json({ error: 'Cell not found' }, { status: 404 })
    }

    // Member stats
    const memberStats = {
      total: cell.memberships.length,
      hosts: cell.memberships.filter(m => m.role === 'HOST').length,
      cohosts: cell.memberships.filter(m => m.role === 'COHOST').length,
      members: cell.memberships.filter(m => m.role === 'MEMBER').length,
    }

    // Session stats
    const sessions = cell.sessionRecords
    const sessionStats = {
      total: sessions.length,
      byType: {
        CIRCLE: sessions.filter(s => s.sessionType === 'CIRCLE').length,
        STUDY: sessions.filter(s => s.sessionType === 'STUDY').length,
        PROJECT: sessions.filter(s => s.sessionType === 'PROJECT').length,
        OTHER: sessions.filter(s => s.sessionType === 'OTHER').length,
      },
      totalAttendance: sessions.reduce((sum, s) => sum + s.attendanceCount, 0),
      averageAttendance: sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.attendanceCount, 0) / sessions.length * 10) / 10
        : 0,
    }

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentSessions = sessions.filter(s => s.ts >= thirtyDaysAgo)

    const activityStats = {
      sessionsLast30Days: recentSessions.length,
      attendanceLast30Days: recentSessions.reduce((sum, s) => sum + s.attendanceCount, 0),
      lastSessionDate: sessions.length > 0 ? sessions[0].ts : null,
    }

    // Health indicator (simple heuristic)
    const isActive = recentSessions.length > 0
    const hasHost = memberStats.hosts > 0 || memberStats.cohosts > 0
    const hasMembers = memberStats.total >= 3
    const healthScore = [isActive, hasHost, hasMembers].filter(Boolean).length

    const health = {
      score: healthScore,
      maxScore: 3,
      status: healthScore === 3 ? 'healthy' : healthScore === 2 ? 'warning' : 'inactive',
      indicators: {
        isActive,
        hasHost,
        hasMembers,
      },
    }

    return NextResponse.json({
      cellId: cell.id,
      cellName: cell.name,
      memberStats,
      sessionStats,
      activityStats,
      health,
    })
  } catch (error) {
    console.error('Error fetching cell stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cell stats' },
      { status: 500 }
    )
  }
}
