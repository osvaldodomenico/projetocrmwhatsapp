import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { whatsappRepository } from '@/repositories/whatsapp.repository'
import { whatsappService } from '@/services/whatsapp.service'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const record = await whatsappRepository.findById(id)
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const data = await whatsappService.connectInstance(record.name)
    // Evolution API returns { base64, code } or { qrcode: { base64 } }
    const qrCode: string | null =
      data?.base64 ?? data?.qrcode?.base64 ?? data?.qr ?? null

    const updated = await whatsappRepository.update(id, {
      status: 'QR_CODE',
      qrCode: qrCode ?? null,
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
