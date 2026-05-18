import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@grupowhats.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@grupowhats.com',
      password: hashedPassword,
      role: 'admin',
    },
  })

  const tagData = [
    { name: 'interessado', color: '#22c55e' },
    { name: 'frio', color: '#3b82f6' },
    { name: 'quente', color: '#ef4444' },
    { name: 'obreiro', color: '#8b5cf6' },
    { name: 'liderança', color: '#f59e0b' },
    { name: 'jovem', color: '#06b6d4' },
    { name: 'visitar', color: '#ec4899' },
    { name: 'prioridade', color: '#dc2626' },
    { name: 'inválido', color: '#6b7280' },
    { name: 'campanha', color: '#0ea5e9' },
    { name: 'ativo', color: '#16a34a' },
    { name: 'retorno pendente', color: '#d97706' },
  ]

  for (const tag of tagData) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    })
  }

  console.log('Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
