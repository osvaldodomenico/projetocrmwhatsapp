import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseFile } from '@/services/import.service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const preview = await parseFile(buffer, file.name)
  return NextResponse.json(preview)
}
