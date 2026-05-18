import { prisma } from '@/lib/prisma'
import { campaignQueue, CampaignJobData } from '@/lib/queue'

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function startCampaign(campaignId: string): Promise<{ jobsQueued: number }> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      campaignContacts: {
        where: { status: 'PENDING' },
        include: { contact: { select: { normalizedPhone: true } } },
      },
    },
  })

  const session = await prisma.whatsAppSession.findFirst({
    where: { status: 'CONNECTED' },
  })

  if (!session) {
    throw new Error('No connected WhatsApp session available')
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'RUNNING', startedAt: new Date() },
  })

  const pendingContacts = campaign.campaignContacts.slice(0, campaign.dailyLimit)
  const minDelay = campaign.minDelay
  const maxDelay = campaign.maxDelay

  for (let i = 0; i < pendingContacts.length; i++) {
    const cc = pendingContacts[i]
    const delayMs = i * randomInt(minDelay, maxDelay) * 1000

    const jobData: CampaignJobData = {
      campaignId,
      contactId: cc.contactId,
      phone: cc.contact.normalizedPhone,
      message: campaign.messageTemplate,
      instanceName: session.name,
    }

    await campaignQueue.add(`send-${cc.contactId}`, jobData, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })
  }

  return { jobsQueued: pendingContacts.length }
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'PAUSED' },
  })

  // Drain waiting jobs for this campaign
  const waiting = await campaignQueue.getWaiting()
  for (const job of waiting) {
    if (job.data?.campaignId === campaignId) {
      await job.remove()
    }
  }

  const delayed = await campaignQueue.getDelayed()
  for (const job of delayed) {
    if (job.data?.campaignId === campaignId) {
      await job.remove()
    }
  }
}

export async function resumeCampaign(campaignId: string): Promise<{ jobsQueued: number }> {
  return startCampaign(campaignId)
}

export async function cancelCampaign(campaignId: string): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'CANCELED' },
  })

  // Reset pending contacts to SKIPPED
  await prisma.campaignContact.updateMany({
    where: { campaignId, status: 'PENDING' },
    data: { status: 'SKIPPED' },
  })

  const waiting = await campaignQueue.getWaiting()
  for (const job of waiting) {
    if (job.data?.campaignId === campaignId) {
      await job.remove()
    }
  }

  const delayed = await campaignQueue.getDelayed()
  for (const job of delayed) {
    if (job.data?.campaignId === campaignId) {
      await job.remove()
    }
  }
}

export const campaignExecutorService = {
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
}
