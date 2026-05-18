import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.status === 'DONE') data.completedAt = new Date()
  if (body.notes !== undefined) data.notes = body.notes
  if (body.dueDate) data.dueDate = new Date(body.dueDate)
  if (body.priority) data.priority = body.priority

  const followUp = await prisma.followUp.update({
    where: { id },
    data,
    include: { contact: { select: { id: true, fullName: true, phone: true } } },
  })
  return NextResponse.json(followUp)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.followUp.update({ where: { id }, data: { status: 'CANCELED' } })
  return NextResponse.json({ success: true })
}
