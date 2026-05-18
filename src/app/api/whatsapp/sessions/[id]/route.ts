import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { whatsappRepository } from '@/repositories/whatsapp.repository'
import { whatsappService } from '@/services/whatsapp.service'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await whatsappRepository.findById(id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(record)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await whatsappRepository.findById(id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await whatsappService.deleteInstance(record.name)
  } catch {
    // Ignore if Evolution API is unavailable
  }

  await whatsappRepository.delete(id)
  return NextResponse.json({ success: true })
}
