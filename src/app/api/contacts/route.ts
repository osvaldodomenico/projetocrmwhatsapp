import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactService, createContactSchema } from '@/services/contact.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const filters = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    temperature: searchParams.get('temperature') ?? undefined,
    leadStage: searchParams.get('leadStage') ?? undefined,
    church: searchParams.get('church') ?? undefined,
    groupName: searchParams.get('groupName') ?? undefined,
    neighborhood: searchParams.get('neighborhood') ?? undefined,
    tagId: searchParams.get('tagId') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    limit: Number(searchParams.get('limit') ?? 50),
    orderBy: searchParams.get('orderBy') ?? 'createdAt',
    order: (searchParams.get('order') ?? 'desc') as 'asc' | 'desc',
  }

  const result = await contactService.list(filters)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const contact = await contactService.create(parsed.data)
    return NextResponse.json(contact, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
