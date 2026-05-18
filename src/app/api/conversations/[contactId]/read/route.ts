import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ contactId: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId } = await params

  await prisma.whatsAppMessage.updateMany({
    where: {
      contactId,
      direction: 'INBOUND',
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
