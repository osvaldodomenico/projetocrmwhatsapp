import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { campaignRepository } from '@/repositories/campaign.repository'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  messageTemplate: z.string().min(1),
  scheduledAt: z.string().optional(),
  minDelay: z.number().min(5).default(20),
  maxDelay: z.number().min(10).default(90),
  dailyLimit: z.number().min(1).default(200),
  sessionId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const status = req.nextUrl.searchParams.get('status') ?? undefined
  const campaigns = await campaignRepository.findMany(status)
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { scheduledAt, ...rest } = parsed.data
  const campaign = await campaignRepository.create({
    ...rest,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    createdById: (session.user as any).id,
  })
  return NextResponse.json(campaign, { status: 201 })
}
