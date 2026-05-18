import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ contactId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId } = await params
  const { leadStage } = await req.json()

  const validStages = ['NOVO', 'QUALIFICANDO', 'PROPOSTA', 'FECHADO', 'PERDIDO']
  if (!validStages.includes(leadStage)) return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data: { leadStage },
    select: { id: true, leadStage: true }
  })
  return NextResponse.json(contact)
}
