import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { contacts: true } } } })
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  try {
    const tag = await prisma.tag.create({ data: parsed.data })
    return NextResponse.json(tag, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Tag já existe' }, { status: 409 })
  }
}
