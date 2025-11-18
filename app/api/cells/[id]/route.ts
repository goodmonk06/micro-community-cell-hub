import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCellSchema } from '@/lib/validations/cell'

// GET /api/cells/[id] - Get a specific cell
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cell = await prisma.cell.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          where: { leftAt: null }, // Only active members
          orderBy: { joinedAt: 'desc' },
        },
        sessionRecords: {
          orderBy: { ts: 'desc' },
          take: 10, // Get latest 10 sessions
        },
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

    if (!cell) {
      return NextResponse.json({ error: 'Cell not found' }, { status: 404 })
    }

    return NextResponse.json({ cell })
  } catch (error) {
    console.error('Error fetching cell:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cell' },
      { status: 500 }
    )
  }
}

// PUT /api/cells/[id] - Update a cell
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateCellSchema.parse(body)

    const cell = await prisma.cell.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ cell })
  } catch (error: any) {
    console.error('Error updating cell:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Cell not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to update cell' },
      { status: 500 }
    )
  }
}

// DELETE /api/cells/[id] - Delete a cell
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cell.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Cell deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting cell:', error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Cell not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to delete cell' },
      { status: 500 }
    )
  }
}
