import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSessionSchema } from '@/lib/validations/session'

// GET /api/sessions - List session records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cellId = searchParams.get('cellId')
    const sessionType = searchParams.get('sessionType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (cellId) where.cellId = cellId
    if (sessionType) where.sessionType = sessionType

    const sessions = await prisma.cellSessionRecord.findMany({
      where,
      include: {
        cell: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
      orderBy: { ts: 'desc' },
      take: limit,
    })

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create a new session record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)

    const sessionData: any = { ...validatedData }
    if (sessionData.ts) {
      sessionData.ts = new Date(sessionData.ts)
    }

    const session = await prisma.cellSessionRecord.create({
      data: sessionData,
      include: {
        cell: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating session:', error)

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
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
