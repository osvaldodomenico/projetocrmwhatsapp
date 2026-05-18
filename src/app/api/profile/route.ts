import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, role: true },
  })
  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, currentPassword, newPassword, image } = await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (image !== undefined) data.image = image

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: 'Senha atual obrigatória' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const valid = user?.password ? await bcrypt.compare(currentPassword, user.password) : false
    if (!valid) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    data.password = await bcrypt.hash(newPassword, 10)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, image: true, role: true },
  })
  return NextResponse.json(user)
}
