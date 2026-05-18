// This file is a standalone worker — do NOT import it in Next.js pages or API routes.
// Run it as a separate process: npx ts-node --project tsconfig.worker.json src/workers/campaign.worker.ts

import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { PrismaClient, CampaignContactStatus, CampaignStatus } from '@prisma/client'

const prisma = new PrismaClient()

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

type CampaignJobData = {
  campaignId: string
  contactId: string
  phone: string
  message: string
  instanceName: string
}

async function checkAndFinishCampaign(campaignId: string): Promise<void> {
  const counts = await prisma.campaignContact.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: { status: true },
  })

  const pending = counts.find((c) => c.status === CampaignContactStatus.PENDING)?._count.status ?? 0

  if (pending === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.FINISHED, finishedAt: new Date() },
    })
    console.log(`[campaign.worker] Campaign ${campaignId} marked as FINISHED`)
  }
}

const worker = new Worker<CampaignJobData>(
  'campaign',
  async (job: Job<CampaignJobData>) => {
    const { campaignId, contactId, phone, message, instanceName } = job.data

    const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || ''

    try {
      const response = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evolutionApiKey,
        },
        body: JSON.stringify({ number: phone, text: message }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Evolution API error ${response.status}: ${errorText}`)
      }

      const result = (await response.json()) as { key?: { id?: string } }
      const messageId = result?.key?.id ?? undefined

      await prisma.campaignContact.update({
        where: { campaignId_contactId: { campaignId, contactId } },
        data: {
          status: CampaignContactStatus.SENT,
          sentAt: new Date(),
        },
      })

      console.log(`[campaign.worker] Sent to ${phone} (campaign: ${campaignId}, msgId: ${messageId ?? 'n/a'})`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)

      await prisma.campaignContact.update({
        where: { campaignId_contactId: { campaignId, contactId } },
        data: { status: CampaignContactStatus.FAILED, errorMsg },
      })

      console.error(`[campaign.worker] Failed to send to ${phone}: ${errorMsg}`)
      throw err // re-throw so BullMQ retries
    } finally {
      await checkAndFinishCampaign(campaignId)
    }
  },
  {
    connection,
    concurrency: 1,
  }
)

worker.on('completed', (job) => {
  console.log(`[campaign.worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[campaign.worker] Job ${job?.id} failed:`, err.message)
})

process.on('SIGTERM', async () => {
  await worker.close()
  await prisma.$disconnect()
  await connection.quit()
})

process.on('SIGINT', async () => {
  await worker.close()
  await prisma.$disconnect()
  await connection.quit()
})

console.log('[campaign.worker] Worker started, waiting for jobs...')
