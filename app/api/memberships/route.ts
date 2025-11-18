import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMembershipSchema } from '@/lib/validations/membership'

// GET /api/memberships - List memberships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cellId = searchParams.get('cellId')
    const memberId = searchParams.get('memberId')
    const active = searchParams.get('active') === 'true'

    const where: any = {}
    if (cellId) where.cellId = cellId
    if (memberId) where.memberId = memberId
    if (active) where.leftAt = null

    const memberships = await prisma.cellMembership.findMany({
      where,
      include: {
        cell: true,
      },
      orderBy: { joinedAt: 'desc' },
    })

    return NextResponse.json({ memberships })
  } catch (error) {
    console.error('Error fetching memberships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    )
  }
}

// POST /api/memberships - Create a new membership
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createMembershipSchema.parse(body)

    // Check if active membership already exists
    const existing = await prisma.cellMembership.findFirst({
      where: {
        cellId: validatedData.cellId,
        memberId: validatedData.memberId,
        leftAt: null,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Member already has an active membership in this cell' },
        { status: 409 }
      )
    }

    const membership = await prisma.cellMembership.create({
      data: validatedData,
      include: {
        cell: true,
      },
    })

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating membership:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cell not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create membership' },
      { status: 500 }
    )
  }
}
