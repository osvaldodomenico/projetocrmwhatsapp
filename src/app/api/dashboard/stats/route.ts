import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalContacts,
    newThisWeek,
    hotLeads,
    warmLeads,
    coldLeads,
    byStage,
    followUpsToday,
    birthdaysThisWeek,
    campaignsRunning,
    recentImports,
  ] = await Promise.all([
    prisma.contact.count({ where: { status: 'ACTIVE' } }),
    prisma.contact.count({ where: { status: 'ACTIVE', createdAt: { gte: weekStart } } }),
    prisma.contact.count({ where: { status: 'ACTIVE', temperature: 'HOT' } }),
    prisma.contact.count({ where: { status: 'ACTIVE', temperature: 'WARM' } }),
    prisma.contact.count({ where: { status: 'ACTIVE', temperature: 'COLD' } }),
    prisma.$queryRaw`SELECT leadStage as stage, COUNT(*) as count FROM crmwhatsapp_contacts WHERE status = 'ACTIVE' GROUP BY leadStage`,
    prisma.followUp.count({ where: { status: 'PENDING', dueDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } } }),
    prisma.contact.count({
      where: {
        status: 'ACTIVE',
        birthDate: {
          not: null,
        },
      },
    }),
    prisma.campaign.count({ where: { status: 'RUNNING' } }),
    prisma.importLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { fileName: true, imported: true, createdAt: true } }),
  ])

  // Contacts added per day last 30 days
  const last30days = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM crmwhatsapp_contacts
    WHERE createdAt >= ${monthStart} AND status = 'ACTIVE'
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `

  return NextResponse.json({
    totalContacts,
    newThisWeek,
    temperature: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
    byStage: (byStage as any[]).map(r => ({ stage: r.stage, count: Number(r.count) })),
    followUpsToday,
    birthdaysThisWeek,
    campaignsRunning,
    recentImports,
    growthChart: last30days.map(r => ({ date: r.date, count: Number(r.count) })),
  })
}
