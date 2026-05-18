import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { executeImport } from '@/services/import.service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const mappingRaw = formData.get('mapping') as string
  if (!file || !mappingRaw) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const mapping = JSON.parse(mappingRaw)
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await executeImport(buffer, mapping, (session.user as any).id ?? '')
  return NextResponse.json(result)
}
