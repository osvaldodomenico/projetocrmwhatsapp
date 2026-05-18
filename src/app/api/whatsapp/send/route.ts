import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { whatsappRepository } from '@/repositories/whatsapp.repository'
import { whatsappService } from '@/services/whatsapp.service'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sessionId, phone, message } = body as {
    sessionId: string
    phone: string
    message: string
  }

  if (!sessionId || !phone || !message) {
    return NextResponse.json({ error: 'sessionId, phone and message are required' }, { status: 400 })
  }

  const record = await whatsappRepository.findById(sessionId)
  if (!record) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const normalizedPhone = normalizePhone(phone)

  // Find contact by normalizedPhone — required for WhatsAppMessage.contactId
  const contact = await prisma.contact.findUnique({ where: { normalizedPhone } })
  if (!contact) {
    return NextResponse.json({ error: 'Contact not found for this phone number' }, { status: 404 })
  }

  try {
    const result = await whatsappService.sendTextMessage(record.name, normalizedPhone, message)

    await prisma.whatsAppMessage.create({
      data: {
        sessionId,
        contactId: contact.id,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        body: message,
        externalId: result?.key?.id ?? null,
      },
    })

    return NextResponse.json({ success: true, messageId: result?.key?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
