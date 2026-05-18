import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { whatsappRepository } from '@/repositories/whatsapp.repository'
import { whatsappService } from '@/services/whatsapp.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await whatsappRepository.findAll()
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { instanceName } = body as { instanceName: string }

  if (!instanceName || typeof instanceName !== 'string') {
    return NextResponse.json({ error: 'instanceName is required' }, { status: 400 })
  }

  try {
    await whatsappService.createInstance(instanceName)
  } catch {
    // Evolution API may not be configured — continue and save to DB
  }

  const record = await whatsappRepository.create({ name: instanceName, status: 'DISCONNECTED' })
  return NextResponse.json(record, { status: 201 })
}
