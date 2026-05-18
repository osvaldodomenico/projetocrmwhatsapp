import { prisma } from '@/lib/prisma'

export class CampaignRepository {
  async findMany(status?: string) {
    return prisma.campaign.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { campaignContacts: true } },
        campaignContacts: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        campaignContacts: {
          include: { contact: { select: { id: true, fullName: true, phone: true, status: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async create(data: any) {
    return prisma.campaign.create({ data })
  }

  async update(id: string, data: any) {
    return prisma.campaign.update({ where: { id }, data })
  }

  async addContacts(campaignId: string, contactIds: string[]) {
    return prisma.campaignContact.createMany({
      data: contactIds.map(contactId => ({ campaignId, contactId })),
      skipDuplicates: true,
    })
  }

  async removeContact(campaignId: string, contactId: string) {
    return prisma.campaignContact.deleteMany({
      where: { campaignId, contactId },
    })
  }

  async getStats(campaignId: string) {
    const contacts = await prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { id: true },
    })
    const total = await prisma.campaignContact.count({ where: { campaignId } })
    return {
      total,
      byStatus: contacts.map((c: any) => ({ status: c.status, count: c._count.id })),
    }
  }
}

export const campaignRepository = new CampaignRepository()
