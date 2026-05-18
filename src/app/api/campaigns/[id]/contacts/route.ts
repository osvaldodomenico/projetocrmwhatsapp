import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { campaignRepository } from '@/repositories/campaign.repository'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { contactIds, filters } = await req.json()

  let ids: string[] = contactIds ?? []

  // If filters provided, add all matching contacts
  if (filters) {
    const where: any = { archivedAt: null, optOut: false }
    if (filters.status) where.status = filters.status
    if (filters.temperature) where.temperature = filters.temperature
    if (filters.church) where.church = { contains: filters.church }
    if (filters.tagId) where.tags = { some: { tagId: filters.tagId } }

    const contacts = await prisma.contact.findMany({ where, select: { id: true } })
    ids = [...new Set([...ids, ...contacts.map((c: any) => c.id)])]
  }

  if (ids.length === 0) return NextResponse.json({ error: 'No contacts' }, { status: 400 })

  await campaignRepository.addContacts(id, ids)
  const stats = await campaignRepository.getStats(id)
  return NextResponse.json(stats)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { contactId } = await req.json()
  await campaignRepository.removeContact(id, contactId)
  return NextResponse.json({ success: true })
}
