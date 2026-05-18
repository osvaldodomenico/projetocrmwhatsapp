import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all contacts that have at least one WhatsAppMessage
  // ordered by their most recent message date
  const contacts = await prisma.contact.findMany({
    where: {
      whatsappMessages: {
        some: {},
      },
    },
    include: {
      tags: {
        include: { tag: true },
      },
      whatsappMessages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  // Count unread (INBOUND messages where readAt is null) per contact
  const unreadCounts = await prisma.whatsAppMessage.groupBy({
    by: ['contactId'],
    where: {
      direction: 'INBOUND',
      readAt: null,
    },
    _count: { id: true },
  })

  const unreadMap: Record<string, number> = {}
  for (const row of unreadCounts) {
    unreadMap[row.contactId] = row._count.id
  }

  // Sort by most recent message
  const sorted = contacts
    .filter((c) => c.whatsappMessages.length > 0)
    .sort((a, b) => {
      const aDate = a.whatsappMessages[0]?.createdAt?.getTime() ?? 0
      const bDate = b.whatsappMessages[0]?.createdAt?.getTime() ?? 0
      return bDate - aDate
    })

  const result = sorted.map((contact) => ({
    contact: {
      id: contact.id,
      fullName: contact.fullName,
      phone: contact.phone,
      normalizedPhone: contact.normalizedPhone,
      temperature: contact.temperature,
      status: contact.status,
      tags: contact.tags.map((ct) => ({ id: ct.tag.id, name: ct.tag.name, color: ct.tag.color })),
    },
    lastMessage: contact.whatsappMessages[0] ?? null,
    unreadCount: unreadMap[contact.id] ?? 0,
  }))

  return NextResponse.json(result)
}
