import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      interactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      whatsappMessages: { where: { direction: 'INBOUND' }, take: 5 },
      campaignContacts: { where: { status: { in: ['DELIVERED', 'READ', 'REPLIED'] } } }
    }
  })

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let score = 0
  // Has phone
  if (contact.normalizedPhone) score += 10
  // Has name
  if (contact.firstName && contact.lastName) score += 5
  // Has church/group (context data)
  if (contact.church) score += 5
  if (contact.groupName) score += 5
  // Replied to WhatsApp
  score += Math.min(contact.whatsappMessages.length * 10, 30)
  // Campaign engagement
  score += Math.min(contact.campaignContacts.length * 5, 20)
  // Interactions (manual notes, calls, etc)
  score += Math.min(contact.interactions.length * 3, 15)
  // Recency (last contact within 7 days)
  if (contact.lastContactAt) {
    const daysSince = (Date.now() - contact.lastContactAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince <= 7) score += 10
    else if (daysSince <= 30) score += 5
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: { score: Math.min(score, 100) },
    select: { id: true, score: true }
  })

  return NextResponse.json(updated)
}
