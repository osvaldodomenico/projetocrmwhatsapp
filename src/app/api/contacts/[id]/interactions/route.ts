import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { interactionRepository } from '@/repositories/interaction.repository'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  type: z.enum(['WHATSAPP', 'CALL', 'VISIT', 'NOTE', 'SYSTEM']),
  message: z.string().min(1),
  summary: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const interactions = await interactionRepository.findByContact(id)
  return NextResponse.json(interactions)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const interaction = await interactionRepository.create({
    contactId: id,
    userId: (session.user as any).id,
    ...parsed.data,
  })
  return NextResponse.json(interaction, { status: 201 })
}
