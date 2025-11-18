import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateMembershipSchema } from '@/lib/validations/membership'

// GET /api/memberships/[id] - Get a specific membership
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const membership = await prisma.cellMembership.findUnique({
      where: { id: params.id },
      include: {
        cell: true,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('Error fetching membership:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership' },
      { status: 500 }
    )
  }
}

// PUT /api/memberships/[id] - Update a membership (e.g., change role or set leftAt)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateMembershipSchema.parse(body)

    const updateData: any = {}
    if (validatedData.role) updateData.role = validatedData.role
    if ('leftAt' in validatedData) {
      updateData.leftAt = validatedData.leftAt ? new Date(validatedData.leftAt) : null
    }

    const membership = await prisma.cellMembership.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cell: true,
      },
    })

    return NextResponse.json({ membership })
  } catch (error: any) {
    console.error('Error updating membership:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    )
  }
}

// DELETE /api/memberships/[id] - Remove a membership (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cellMembership.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Membership deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting membership:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Membership not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete membership' },
      { status: 500 }
    )
  }
}
