import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const templates = await prisma.messageTemplate.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, content, category } = await req.json()
  if (!name || !content) return NextResponse.json({ error: 'name and content required' }, { status: 400 })
  const userId = (session?.user as any)?.id ?? null
  const template = await prisma.messageTemplate.create({ data: { name, content, category: category || null, userId } })
  return NextResponse.json(template, { status: 201 })
}
