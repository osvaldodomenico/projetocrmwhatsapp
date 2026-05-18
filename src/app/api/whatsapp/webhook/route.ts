import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint — Evolution API calls this without JWT auth

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55')) return digits
  return `55${digits}`
}

function extractPhone(remoteJid: string): string | null {
  // Skip groups
  if (remoteJid.endsWith('@g.us')) return null
  // Strip suffixes
  return remoteJid
    .replace('@s.whatsapp.net', '')
    .replace('@c.us', '')
    .replace('@lid', '')
}

export async function POST(req: NextRequest) {
  try {
    // Optional webhook secret validation
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (secret) {
      const headerSecret =
        req.headers.get('x-webhook-secret') ?? req.headers.get('authorization')
      if (headerSecret !== secret) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const payload = await req.json()
    const { event, instance, data } = payload as {
      event: string
      instance: string
      data: {
        key: { remoteJid: string; fromMe: boolean; id: string }
        message?: { conversation?: string; extendedTextMessage?: { text: string } }
        messageTimestamp?: number
        pushName?: string
      }
    }

    if (event !== 'messages.upsert') {
      return NextResponse.json({ success: true, skipped: true })
    }

    const { key, message, pushName } = data

    // Skip group messages
    const rawPhone = extractPhone(key.remoteJid)
    if (!rawPhone) {
      return NextResponse.json({ success: true, skipped: 'group' })
    }

    const normalizedPhone = normalizePhone(rawPhone)

    // Extract text content
    const body =
      message?.conversation ??
      message?.extendedTextMessage?.text ??
      ''

    // Find session by instance name
    const session = await prisma.whatsAppSession.findUnique({
      where: { name: instance },
    })

    if (!session) {
      // Session not found — still accept and return OK to avoid Evolution retrying
      return NextResponse.json({ success: true, skipped: 'no_session' })
    }

    // Find or create contact
    let contact = await prisma.contact.findUnique({
      where: { normalizedPhone },
    })

    if (!contact && !key.fromMe) {
      const name = pushName ?? normalizedPhone
      contact = await prisma.contact.create({
        data: {
          firstName: name,
          fullName: name,
          phone: rawPhone,
          normalizedPhone,
          source: 'whatsapp',
        },
      })
    }

    if (!contact) {
      return NextResponse.json({ success: true, skipped: 'no_contact' })
    }

    // Avoid duplicate messages by externalId
    if (key.id) {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: { externalId: key.id },
      })
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true })
      }
    }

    await prisma.whatsAppMessage.create({
      data: {
        contactId: contact.id,
        sessionId: session.id,
        direction: key.fromMe ? 'OUTBOUND' : 'INBOUND',
        messageType: 'TEXT',
        body: body || '',
        externalId: key.id ?? null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[webhook] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
