import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { whatsappRepository } from '@/repositories/whatsapp.repository'
import { whatsappService } from '@/services/whatsapp.service'
import { WhatsAppSessionStatus } from '@prisma/client'

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

  try {
    const data = await whatsappService.getInstanceStatus(record.name)
    // data.instance.state: 'open' | 'close' | 'connecting'
    const state: string = data?.instance?.state ?? data?.state ?? 'close'

    let status: WhatsAppSessionStatus = 'DISCONNECTED'
    let phone: string | null = record.phone

    if (state === 'open') {
      status = 'CONNECTED'
      phone = data?.instance?.owner ?? record.phone
    } else if (state === 'connecting') {
      status = 'CONNECTING'
    }

    const updated = await whatsappRepository.update(id, { status, phone: phone ?? null })

    return NextResponse.json({ status: updated.status, phone: updated.phone })
  } catch (err: any) {
    return NextResponse.json({ status: record.status, phone: record.phone, error: err.message })
  }
}
