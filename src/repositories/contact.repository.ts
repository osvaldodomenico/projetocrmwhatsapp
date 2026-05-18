import { prisma } from '@/lib/prisma'
import { ContactFilters, PaginatedResult, ContactWithTags } from '@/types'

export class ContactRepository {
  async findMany(filters: ContactFilters): Promise<PaginatedResult<ContactWithTags>> {
    const {
      search, status, temperature, leadStage, church, groupName, neighborhood, tagId,
      page = 1, limit = 50, orderBy = 'createdAt', order = 'desc'
    } = filters

    const where: any = { archivedAt: null }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { normalizedPhone: { contains: search } },
        { phone: { contains: search } },
        { church: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (temperature) where.temperature = temperature
    if (leadStage) where.leadStage = leadStage
    if (church) where.church = { contains: church }
    if (groupName) where.groupName = { contains: groupName }
    if (neighborhood) where.neighborhood = { contains: neighborhood }
    if (tagId) where.tags = { some: { tagId } }

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { [orderBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return {
      data: data as ContactWithTags[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findById(id: string): Promise<ContactWithTags | null> {
    return prisma.contact.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    }) as Promise<ContactWithTags | null>
  }

  async findByPhone(normalizedPhone: string) {
    return prisma.contact.findUnique({ where: { normalizedPhone } })
  }

  async create(data: any) {
    return prisma.contact.create({
      data,
      include: { tags: { include: { tag: true } } },
    })
  }

  async update(id: string, data: any) {
    return prisma.contact.update({
      where: { id },
      data,
      include: { tags: { include: { tag: true } } },
    })
  }

  async delete(id: string) {
    return prisma.contact.update({
      where: { id },
      data: { archivedAt: new Date() },
    })
  }

  async getDistinctValues(field: 'church' | 'groupName' | 'neighborhood') {
    const results = await prisma.contact.findMany({
      where: { [field]: { not: null }, archivedAt: null },
      select: { [field]: true },
      distinct: [field as any],
      orderBy: { [field]: 'asc' },
    })
    return results.map((r: any) => r[field]).filter(Boolean)
  }

  async syncTags(contactId: string, tagIds: string[]) {
    await prisma.contactTag.deleteMany({ where: { contactId } })
    if (tagIds.length > 0) {
      await prisma.contactTag.createMany({
        data: tagIds.map(tagId => ({ contactId, tagId })),
        skipDuplicates: true,
      })
    }
  }

  async getDashboardStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalContacts, activeContacts, coldContacts, hotContacts, warmContacts,
      noResponseContacts, pendingFollowUps, todayInteractions,
    ] = await Promise.all([
      prisma.contact.count({ where: { archivedAt: null } }),
      prisma.contact.count({ where: { status: 'ACTIVE', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'COLD', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'HOT', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'WARM', archivedAt: null } }),
      prisma.contact.count({ where: { status: 'NO_RESPONSE', archivedAt: null } }),
      prisma.followUp.count({ where: { status: 'PENDING' } }),
      prisma.interaction.count({ where: { createdAt: { gte: today } } }),
    ])

    // Group by church
    const churchGroups = await prisma.contact.groupBy({
      by: ['church'],
      where: { church: { not: null }, archivedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const neighborhoodGroups = await prisma.contact.groupBy({
      by: ['neighborhood'],
      where: { neighborhood: { not: null }, archivedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const statusGroups = await prisma.contact.groupBy({
      by: ['status'],
      where: { archivedAt: null },
      _count: { id: true },
    })

    return {
      totalContacts, activeContacts, coldContacts, hotContacts, warmContacts,
      noResponseContacts, pendingFollowUps, todayInteractions, campaignsSent: 0,
      contactsByChurch: churchGroups.map((r: any) => ({ church: r.church, count: r._count.id })),
      contactsByNeighborhood: neighborhoodGroups.map((r: any) => ({ neighborhood: r.neighborhood, count: r._count.id })),
      contactsByStatus: statusGroups.map((r: any) => ({ status: r.status, count: r._count.id })),
    }
  }
}

export const contactRepository = new ContactRepository()
