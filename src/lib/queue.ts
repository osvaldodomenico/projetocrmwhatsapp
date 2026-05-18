import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const campaignQueue = new Queue('campaign', { connection })

export type CampaignJobData = {
  campaignId: string
  contactId: string
  phone: string
  message: string
  instanceName: string
}
