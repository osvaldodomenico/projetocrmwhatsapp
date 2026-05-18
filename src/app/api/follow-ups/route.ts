import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  contactId: z.string(),
  dueDate: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? 'PENDING'

  const followUps = await prisma.followUp.findMany({
    where: { status: status as 'PENDING' | 'DONE' | 'CANCELED' },
    include: {
      contact: { select: { id: true, fullName: true, phone: true, church: true } },
      user: { select: { name: true } },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 100,
  })
  return NextResponse.json(followUps)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const followUp = await prisma.followUp.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      assignedTo: (session.user as { id: string }).id,
    },
    include: { contact: { select: { id: true, fullName: true, phone: true } } },
  })
  return NextResponse.json(followUp, { status: 201 })
}
