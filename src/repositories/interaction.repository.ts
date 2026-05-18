import { prisma } from '@/lib/prisma'

export class InteractionRepository {
  async findByContact(contactId: string, limit = 100) {
    return prisma.interaction.findMany({
      where: { contactId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async create(data: {
    contactId: string
    userId?: string
    type: string
    message: string
    summary?: string
  }) {
    const interaction = await prisma.interaction.create({ data: data as any })

    await prisma.contact.update({
      where: { id: data.contactId },
      data: { lastContactAt: new Date() },
    })

    return interaction
  }
}

export const interactionRepository = new InteractionRepository()
