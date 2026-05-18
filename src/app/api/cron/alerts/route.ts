import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const today = { month: now.getMonth() + 1, day: now.getDate() }
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Birthdays this week (compare month/day only, ignoring year)
  const birthdayContacts = await prisma.$queryRaw<any[]>`
    SELECT id, fullName, normalizedPhone, birthDate
    FROM crmwhatsapp_contacts
    WHERE status = 'ACTIVE'
      AND birthDate IS NOT NULL
      AND MONTH(birthDate) = ${today.month}
      AND DAY(birthDate) BETWEEN ${today.day} AND ${today.day + 6}
    LIMIT 20
  `

  // Cold leads: active but no contact in 30+ days
  const coldLeads = await prisma.contact.findMany({
    where: {
      status: 'ACTIVE',
      temperature: { not: 'COLD' },
      OR: [
        { lastContactAt: null },
        { lastContactAt: { lt: thirtyDaysAgo } }
      ]
    },
    select: { id: true, fullName: true, normalizedPhone: true, temperature: true, lastContactAt: true },
    orderBy: { lastContactAt: 'asc' },
    take: 20
  })

  // New contacts this week with no interaction
  const newNoContact = await prisma.contact.findMany({
    where: {
      status: 'ACTIVE',
      createdAt: { gte: sevenDaysAgo },
      lastContactAt: null
    },
    select: { id: true, fullName: true, normalizedPhone: true, createdAt: true },
    take: 10
  })

  return NextResponse.json({
    birthdays: birthdayContacts.map(c => ({
      ...c,
      birthDate: c.birthDate?.toISOString?.() ?? c.birthDate
    })),
    coldLeads,
    newNoContact,
    generatedAt: now.toISOString()
  })
}
