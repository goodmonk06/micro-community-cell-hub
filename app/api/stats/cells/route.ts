import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats/cells - Get cell statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    const where = communityId ? { communityId } : {}

    // Get all cells with counts
    const cells = await prisma.cell.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: {
              where: { leftAt: null },
            },
            sessionRecords: true,
          },
        },
      },
    })

    // Calculate stats
    const stats = cells.map(cell => {
      const activeMemberCount = cell._count.memberships
      const totalSessions = cell._count.sessionRecords

      return {
        cellId: cell.id,
        cellName: cell.name,
        cellKey: cell.key,
        activeMemberCount,
        totalSessions,
        createdAt: cell.createdAt,
      }
    })

    // Overall summary
    const summary = {
      totalCells: cells.length,
      totalActiveMembers: stats.reduce((sum, s) => sum + s.activeMemberCount, 0),
      totalSessions: stats.reduce((sum, s) => sum + s.totalSessions, 0),
      averageMembersPerCell: stats.length > 0
        ? Math.round(stats.reduce((sum, s) => sum + s.activeMemberCount, 0) / stats.length * 10) / 10
        : 0,
    }

    return NextResponse.json({ summary, cells: stats })
  } catch (error) {
    console.error('Error fetching cell stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cell stats' },
      { status: 500 }
    )
  }
}
