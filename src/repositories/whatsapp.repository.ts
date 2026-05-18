import { prisma } from '@/lib/prisma'
import { WhatsAppSession, WhatsAppSessionStatus } from '@prisma/client'

export class WhatsAppRepository {
  async findAll(): Promise<WhatsAppSession[]> {
    return prisma.whatsAppSession.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string): Promise<WhatsAppSession | null> {
    return prisma.whatsAppSession.findUnique({ where: { id } })
  }

  async findByName(name: string): Promise<WhatsAppSession | null> {
    return prisma.whatsAppSession.findUnique({ where: { name } })
  }

  async create(data: { name: string; status?: WhatsAppSessionStatus }): Promise<WhatsAppSession> {
    return prisma.whatsAppSession.create({ data })
  }

  async update(
    id: string,
    data: Partial<{
      status: WhatsAppSessionStatus
      qrCode: string | null
      phone: string | null
    }>
  ): Promise<WhatsAppSession> {
    return prisma.whatsAppSession.update({ where: { id }, data })
  }

  async delete(id: string): Promise<void> {
    await prisma.whatsAppSession.delete({ where: { id } })
  }
}

export const whatsappRepository = new WhatsAppRepository()
