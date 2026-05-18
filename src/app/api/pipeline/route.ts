import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await prisma.contact.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true, fullName: true, normalizedPhone: true, leadStage: true,
      temperature: true, score: true, church: true, lastContactAt: true,
      tags: { include: { tag: { select: { name: true, color: true } } } }
    },
    orderBy: { score: 'desc' }
  })

  const stages = ['NOVO', 'QUALIFICANDO', 'PROPOSTA', 'FECHADO', 'PERDIDO']
  const grouped: Record<string, typeof contacts> = {}
  stages.forEach(s => { grouped[s] = [] })
  contacts.forEach(c => {
    const stage = stages.includes(c.leadStage) ? c.leadStage : 'NOVO'
    grouped[stage].push(c)
  })

  return NextResponse.json(grouped)
}
