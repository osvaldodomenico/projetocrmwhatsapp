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
      temperature: true, score: true, church: true, neighborhood: true, city: true, lastContactAt: true,
      tags: { include: { tag: { select: { name: true, color: true } } } }
    },
    orderBy: { score: 'desc' }
  })

  const stages = ['NOVO', 'EM CONTATO', 'FINALIZADO', 'PERDIDO']
  const grouped: Record<string, typeof contacts> = {}
  stages.forEach(s => { grouped[s] = [] })
  contacts.forEach(c => {
    // Migrate legacy stage keys on the fly
    const legacyMap: Record<string, string> = { QUALIFICANDO: 'EM CONTATO', PROPOSTA: 'EM CONTATO', FECHADO: 'FINALIZADO' }
    const stage = legacyMap[c.leadStage] ?? (stages.includes(c.leadStage) ? c.leadStage : 'NOVO')
    grouped[stage].push(c)
  })

  return NextResponse.json(grouped)
}
