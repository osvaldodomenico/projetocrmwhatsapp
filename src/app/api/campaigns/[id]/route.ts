import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { campaignRepository } from '@/repositories/campaign.repository'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const campaign = await campaignRepository.findById(id)
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(campaign)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const campaign = await campaignRepository.update(id, body)
  return NextResponse.json(campaign)
}
