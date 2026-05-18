import { contactRepository } from '@/repositories/contact.repository'
import { ContactFilters } from '@/types'
import { z } from 'zod'

export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().min(8),
  church: z.string().optional(),
  groupName: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const updateContactSchema = createContactSchema.partial()

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length >= 10) return `55${digits}`
  return `55${digits}`
}

export class ContactService {
  async list(filters: ContactFilters) {
    return contactRepository.findMany(filters)
  }

  async getById(id: string) {
    const contact = await contactRepository.findById(id)
    if (!contact) throw new Error('Contato não encontrado')
    return contact
  }

  async create(data: z.infer<typeof createContactSchema>) {
    const normalizedPhone = normalizePhone(data.phone)
    const existing = await contactRepository.findByPhone(normalizedPhone)
    if (existing) throw new Error(`Contato já existe: ${existing.fullName}`)

    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')
    const { tagIds, birthDate, ...rest } = data

    const contact = await contactRepository.create({
      ...rest,
      fullName,
      normalizedPhone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
    })

    if (tagIds?.length) {
      await contactRepository.syncTags(contact.id, tagIds)
    }

    return contactRepository.findById(contact.id)
  }

  async update(id: string, data: z.infer<typeof updateContactSchema>) {
    const { tagIds, birthDate, firstName, lastName, phone, ...rest } = data
    const updateData: any = { ...rest }

    if (firstName !== undefined || lastName !== undefined) {
      const current = await contactRepository.findById(id)
      updateData.fullName = [firstName ?? current?.firstName, lastName ?? current?.lastName]
        .filter(Boolean).join(' ')
      if (firstName !== undefined) updateData.firstName = firstName
      if (lastName !== undefined) updateData.lastName = lastName
    }

    if (birthDate) updateData.birthDate = new Date(birthDate)
    if (phone) {
      updateData.phone = phone
      updateData.normalizedPhone = normalizePhone(phone)
    }

    await contactRepository.update(id, updateData)

    if (tagIds !== undefined) {
      await contactRepository.syncTags(id, tagIds)
    }

    return contactRepository.findById(id)
  }

  async delete(id: string) {
    return contactRepository.delete(id)
  }

  async getFilterOptions() {
    const [churches, groups, neighborhoods] = await Promise.all([
      contactRepository.getDistinctValues('church'),
      contactRepository.getDistinctValues('groupName'),
      contactRepository.getDistinctValues('neighborhood'),
    ])
    return { churches, groups, neighborhoods }
  }

  async getDashboardStats() {
    return contactRepository.getDashboardStats()
  }
}

export const contactService = new ContactService()
