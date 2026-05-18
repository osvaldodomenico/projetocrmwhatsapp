import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { campaignExecutorService } from '@/services/campaign-executor.service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action } = await req.json()

  const validActions = ['start', 'pause', 'resume', 'cancel']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const statusMap: Record<string, string> = {
    start: 'RUNNING',
    pause: 'PAUSED',
    resume: 'RUNNING',
    cancel: 'CANCELED',
  }

  try {
    let result: { jobsQueued?: number } = {}

    if (action === 'start') {
      result = await campaignExecutorService.startCampaign(id)
    } else if (action === 'pause') {
      await campaignExecutorService.pauseCampaign(id)
    } else if (action === 'resume') {
      result = await campaignExecutorService.resumeCampaign(id)
    } else if (action === 'cancel') {
      await campaignExecutorService.cancelCampaign(id)
    }

    return NextResponse.json({ success: true, status: statusMap[action], ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
