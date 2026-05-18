import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { campaignQueue } from '@/lib/queue'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // params is resolved but not used — queue counts are global for the 'campaign' queue
  await params

  try {
    const counts = await campaignQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
    return NextResponse.json({
      waiting: (counts.waiting ?? 0) + (counts.delayed ?? 0),
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
