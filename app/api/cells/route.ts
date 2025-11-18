import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCellSchema } from '@/lib/validations/cell'

// GET /api/cells - List all cells
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')

    const where = communityId ? { communityId } : {}

    const cells = await prisma.cell.findMany({
      where,
      include: {
        _count: {
          select: {
            memberships: {
              where: { leftAt: null }, // Only active members
            },
            sessionRecords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ cells })
  } catch (error) {
    console.error('Error fetching cells:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cells' },
      { status: 500 }
    )
  }
}

// POST /api/cells - Create a new cell
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCellSchema.parse(body)

    const cell = await prisma.cell.create({
      data: validatedData,
    })

    return NextResponse.json({ cell }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating cell:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A cell with this key already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create cell' },
      { status: 500 }
    )
  }
}
