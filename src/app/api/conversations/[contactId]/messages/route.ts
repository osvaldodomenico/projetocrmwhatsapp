import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { whatsappService } from '@/services/whatsapp.service'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ contactId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId } = await params
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') ?? 50)))
  const skip = (page - 1) * limit

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      tags: { include: { tag: true } },
    },
  })

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const [messages, total] = await prisma.$transaction([
    prisma.whatsAppMessage.findMany({
      where: { contactId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.whatsAppMessage.count({ where: { contactId } }),
  ])

  return NextResponse.json({ messages, total, contact })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId } = await params
  const body = await req.json()
  const { message, sessionId } = body as { message: string; sessionId: string }

  if (!message || !sessionId) {
    return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const whatsappSession = await prisma.whatsAppSession.findUnique({ where: { id: sessionId } })
  if (!whatsappSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  try {
    const result = await whatsappService.sendTextMessage(
      whatsappSession.name,
      contact.normalizedPhone,
      message,
    )

    const saved = await prisma.whatsAppMessage.create({
      data: {
        contactId,
        sessionId,
        direction: 'OUTBOUND',
        messageType: 'TEXT',
        body: message,
        externalId: (result as { key?: { id?: string } })?.key?.id ?? null,
      },
    })

    return NextResponse.json(saved, { status: 201 })
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: errMessage }, { status: 502 })
  }
}
