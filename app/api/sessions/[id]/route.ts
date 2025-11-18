import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateSessionSchema } from '@/lib/validations/session'

// GET /api/sessions/[id] - Get a specific session record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.cellSessionRecord.findUnique({
      where: { id: params.id },
      include: {
        cell: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

// PUT /api/sessions/[id] - Update a session record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSessionSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (updateData.ts) {
      updateData.ts = new Date(updateData.ts)
    }

    const session = await prisma.cellSessionRecord.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cell: true,
      },
    })

    return NextResponse.json({ session })
  } catch (error: any) {
    console.error('Error updating session:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/[id] - Delete a session record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.cellSessionRecord.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting session:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
