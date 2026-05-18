# GrupoWhats CRM — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete WhatsApp CRM system with contact management, bulk messaging, campaign management, and interaction timeline.

**Architecture:** Next.js 15 fullstack (App Router + API Routes), Prisma + PostgreSQL, Redis + BullMQ for queues, Evolution API for WhatsApp. Service/repository pattern with clean separation.

**Tech Stack:** Next.js 15, TypeScript, Prisma, PostgreSQL, Redis, BullMQ, NextAuth v5, shadcn/ui, TailwindCSS, Zustand, TanStack Table, React Hook Form, Zod, xlsx

**Spec:** `docs/superpowers/specs/2026-05-17-grupowhats-crm-design.md`

---

## Chunk 1: Project Scaffold + Docker + Dependencies

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`

- [ ] Run in `/grupowhats` directory:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

- [ ] Install all dependencies:

```bash
npm install @prisma/client prisma next-auth@beta @auth/prisma-adapter
npm install @tanstack/react-table @hookform/resolvers react-hook-form zod
npm install zustand xlsx multer
npm install bullmq ioredis
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install date-fns
npm install -D @types/multer
```

- [ ] Initialize shadcn/ui:

```bash
npx shadcn@latest init -d
```

- [ ] Add shadcn components:

```bash
npx shadcn@latest add button card input label select textarea badge avatar table tabs dialog sheet dropdown-menu command popover calendar form separator skeleton toast sonner progress
```

- [ ] Commit: `git init && git add . && git commit -m "chore: initial Next.js scaffold with dependencies"`

---

### Task 2: Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.local`
- Create: `.env.example`

- [ ] Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: grupowhats_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: grupowhats
      POSTGRES_PASSWORD: grupowhats123
      POSTGRES_DB: grupowhats
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: grupowhats_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

- [ ] Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://grupowhats:grupowhats123@localhost:5432/grupowhats"

# Auth
NEXTAUTH_SECRET="super-secret-key-change-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"

# Evolution API
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="your-evolution-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="GrupoWhats CRM"
```

- [ ] Create `.env.example` (same as above with placeholder values)

- [ ] Start Docker:

```bash
docker-compose up -d
```

- [ ] Commit: `git add . && git commit -m "chore: add Docker Compose for PostgreSQL and Redis"`

---

## Chunk 2: Prisma Schema + Migrations + Seeds

### Task 3: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] Run: `npx prisma init --datasource-provider postgresql`

- [ ] Write complete `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum ContactStatus {
  ACTIVE
  INACTIVE
  FOLLOW_UP
  NO_RESPONSE
  INVALID_NUMBER
  DO_NOT_CONTACT
  CONVERTED
  LOST
}

enum LeadTemperature {
  COLD
  WARM
  HOT
}

enum InteractionType {
  WHATSAPP
  CALL
  VISIT
  NOTE
  SYSTEM
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  RUNNING
  PAUSED
  FINISHED
  CANCELED
}

enum CampaignContactStatus {
  PENDING
  SENT
  DELIVERED
  READ
  REPLIED
  FAILED
  SKIPPED
}

enum FollowUpPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum FollowUpStatus {
  PENDING
  DONE
  CANCELED
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageType {
  TEXT
  IMAGE
  AUDIO
  VIDEO
  DOCUMENT
  LOCATION
  STICKER
}

enum WhatsAppSessionStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  QR_CODE
  ERROR
}

// ─── Users ───────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String    @default("agent")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts     Account[]
  sessions     Session[]
  interactions Interaction[]
  followUps    FollowUp[]
  campaigns    Campaign[]
  auditLogs    AuditLog[]
  importLogs   ImportLog[]
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}

// ─── Contacts ────────────────────────────────────────────

model Contact {
  id              String          @id @default(cuid())
  firstName       String
  lastName        String?
  fullName        String
  phone           String
  normalizedPhone String          @unique
  church          String?
  groupName       String?
  neighborhood    String?
  city            String?
  state           String?
  birthDate       DateTime?
  notes           String?
  avatar          String?
  source          String?         @default("manual")
  status          ContactStatus   @default(ACTIVE)
  temperature     LeadTemperature @default(COLD)
  score           Int             @default(0)
  lastContactAt   DateTime?
  nextFollowupAt  DateTime?
  optOut          Boolean         @default(false)
  archivedAt      DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  tags             ContactTag[]
  interactions     Interaction[]
  followUps        FollowUp[]
  campaignContacts CampaignContact[]
  whatsappMessages WhatsAppMessage[]

  @@index([normalizedPhone])
  @@index([status])
  @@index([temperature])
  @@index([church])
  @@index([groupName])
  @@index([neighborhood])
}

// ─── Tags ────────────────────────────────────────────────

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   @default("#6366f1")
  createdAt DateTime @default(now())

  contacts ContactTag[]
}

model ContactTag {
  id        String   @id @default(cuid())
  contactId String
  tagId     String
  createdAt DateTime @default(now())

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  tag     Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([contactId, tagId])
}

// ─── Interactions ─────────────────────────────────────────

model Interaction {
  id        String          @id @default(cuid())
  contactId String
  userId    String?
  type      InteractionType @default(NOTE)
  message   String
  summary   String?
  sentiment String?
  createdAt DateTime        @default(now())

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id])

  @@index([contactId])
  @@index([createdAt])
}

// ─── Follow-ups ──────────────────────────────────────────

model FollowUp {
  id          String           @id @default(cuid())
  contactId   String
  assignedTo  String?
  dueDate     DateTime
  priority    FollowUpPriority @default(MEDIUM)
  status      FollowUpStatus   @default(PENDING)
  notes       String?
  completedAt DateTime?
  createdAt   DateTime         @default(now())

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [assignedTo], references: [id])

  @@index([contactId])
  @@index([status])
  @@index([dueDate])
}

// ─── Campaigns ───────────────────────────────────────────

model Campaign {
  id              String         @id @default(cuid())
  name            String
  description     String?
  messageTemplate String
  status          CampaignStatus @default(DRAFT)
  scheduledAt     DateTime?
  startedAt       DateTime?
  finishedAt      DateTime?
  createdById     String?
  minDelay        Int            @default(20)
  maxDelay        Int            @default(90)
  dailyLimit      Int            @default(200)
  sessionId       String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  createdBy        User?             @relation(fields: [createdById], references: [id])
  campaignContacts CampaignContact[]
  session          WhatsAppSession?  @relation(fields: [sessionId], references: [id])

  @@index([status])
}

model CampaignContact {
  id          String                @id @default(cuid())
  campaignId  String
  contactId   String
  status      CampaignContactStatus @default(PENDING)
  sentAt      DateTime?
  deliveredAt DateTime?
  readAt      DateTime?
  repliedAt   DateTime?
  errorMsg    String?
  createdAt   DateTime              @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  contact  Contact  @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@unique([campaignId, contactId])
  @@index([campaignId, status])
}

// ─── WhatsApp ────────────────────────────────────────────

model WhatsAppSession {
  id        String                @id @default(cuid())
  name      String                @unique
  status    WhatsAppSessionStatus @default(DISCONNECTED)
  qrCode    String?
  phone     String?
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt

  messages  WhatsAppMessage[]
  campaigns Campaign[]
}

model WhatsAppMessage {
  id          String           @id @default(cuid())
  contactId   String
  sessionId   String?
  campaignId  String?
  direction   MessageDirection
  messageType MessageType      @default(TEXT)
  body        String?
  mediaUrl    String?
  externalId  String?
  deliveredAt DateTime?
  readAt      DateTime?
  failedAt    DateTime?
  createdAt   DateTime         @default(now())

  contact Contact          @relation(fields: [contactId], references: [id], onDelete: Cascade)
  session WhatsAppSession? @relation(fields: [sessionId], references: [id])

  @@index([contactId])
  @@index([sessionId])
  @@index([createdAt])
}

// ─── Audit ───────────────────────────────────────────────

model AuditLog {
  id       String   @id @default(cuid())
  entity   String
  entityId String
  action   String
  oldData  Json?
  newData  Json?
  userId   String?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([entity, entityId])
  @@index([createdAt])
}

// ─── Import Logs ─────────────────────────────────────────

model ImportLog {
  id           String   @id @default(cuid())
  fileName     String
  totalRows    Int
  imported     Int      @default(0)
  updated      Int      @default(0)
  skipped      Int      @default(0)
  errors       Int      @default(0)
  errorDetails Json?
  userId       String?
  createdAt    DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}
```

- [ ] Run migration:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- [ ] Commit: `git add . && git commit -m "feat: complete Prisma schema with all models"`

---

### Task 4: Seeds

**Files:**
- Create: `prisma/seed.ts`

- [ ] Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grupowhats.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@grupowhats.com',
      password: hashedPassword,
      role: 'admin',
    },
  })

  // Default tags
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

  // Sample contacts
  const contacts = [
    {
      firstName: 'João',
      lastName: 'Silva',
      fullName: 'João Silva',
      phone: '11999990001',
      normalizedPhone: '5511999990001',
      church: 'Igreja Central',
      groupName: 'Grupo Jovens',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      status: 'ACTIVE' as const,
      temperature: 'HOT' as const,
      score: 85,
    },
    {
      firstName: 'Maria',
      lastName: 'Santos',
      fullName: 'Maria Santos',
      phone: '11999990002',
      normalizedPhone: '5511999990002',
      church: 'Igreja Norte',
      groupName: 'Grupo Mulheres',
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      status: 'ACTIVE' as const,
      temperature: 'WARM' as const,
      score: 60,
    },
    {
      firstName: 'Pedro',
      lastName: 'Oliveira',
      fullName: 'Pedro Oliveira',
      phone: '11999990003',
      normalizedPhone: '5511999990003',
      church: 'Igreja Sul',
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      status: 'NO_RESPONSE' as const,
      temperature: 'COLD' as const,
      score: 20,
    },
  ]

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { normalizedPhone: contact.normalizedPhone },
      update: {},
      create: contact,
    })
  }

  console.log('✅ Seed completed')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] Install ts-node: `npm install -D ts-node bcryptjs @types/bcryptjs`

- [ ] Run seed: `npx prisma db seed`

- [ ] Commit: `git add . && git commit -m "feat: database seeds with admin user and default tags"`

---

## Chunk 3: Auth + Layout Shell

### Task 5: Prisma Client + Auth Config

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] Create `src/lib/auth.ts`:

```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user?.password) return null

        const isValid = await bcrypt.compare(parsed.data.password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
})
```

- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] Create `src/middleware.ts`:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] Commit: `git add . && git commit -m "feat: NextAuth v5 with credentials provider"`

---

### Task 6: Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/layout.tsx`

- [ ] Create `src/app/login/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
```

- [ ] Create `src/app/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    const res = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    })

    if (res?.error) {
      toast.error('Email ou senha inválidos')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-purple-600/20">
            <MessageSquare className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <CardTitle className="text-2xl text-white">GrupoWhats CRM</CardTitle>
        <CardDescription className="text-slate-400">
          Gestão de relacionamento via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@grupowhats.com"
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] Commit: `git add . && git commit -m "feat: login page with NextAuth credentials"`

---

### Task 7: Dashboard Layout + Sidebar

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/shared/sidebar.tsx`
- Create: `src/components/shared/header.tsx`

- [ ] Create `src/components/shared/sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Megaphone, Calendar, Settings, MessageSquare, Tag, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contatos', label: 'Contatos', icon: Users },
  { href: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/follow-ups', label: 'Follow-ups', icon: Calendar },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-600/20">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">GrupoWhats</h1>
            <p className="text-slate-500 text-xs">CRM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] Create `src/components/shared/header.tsx`:

```tsx
'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? 'Usuário'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6">
      {title && <h2 className="text-white font-semibold">{title}</h2>}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-purple-600 text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            <DropdownMenuItem className="text-slate-300 cursor-pointer" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

- [ ] Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/sidebar'
import { SessionProvider } from 'next-auth/react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
```

- [ ] Update `src/app/globals.css` to use dark background by default

- [ ] Commit: `git add . && git commit -m "feat: dashboard layout with sidebar and header"`

---

## Chunk 4: Contact Repository + Service + API

### Task 8: Types

**Files:**
- Create: `src/types/index.ts`

- [ ] Create `src/types/index.ts`:

```typescript
export type ContactWithTags = {
  id: string
  firstName: string
  lastName: string | null
  fullName: string
  phone: string
  normalizedPhone: string
  church: string | null
  groupName: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  birthDate: Date | null
  notes: string | null
  avatar: string | null
  source: string | null
  status: string
  temperature: string
  score: number
  lastContactAt: Date | null
  nextFollowupAt: Date | null
  optOut: boolean
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  tags: { tag: { id: string; name: string; color: string } }[]
}

export type ContactFilters = {
  search?: string
  status?: string
  temperature?: string
  church?: string
  groupName?: string
  neighborhood?: string
  tagId?: string
  page?: number
  limit?: number
  orderBy?: string
  order?: 'asc' | 'desc'
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type DashboardStats = {
  totalContacts: number
  activeContacts: number
  coldContacts: number
  hotContacts: number
  warmContacts: number
  noResponseContacts: number
  pendingFollowUps: number
  todayInteractions: number
  campaignsSent: number
  contactsByChurch: { church: string; count: number }[]
  contactsByNeighborhood: { neighborhood: string; count: number }[]
  contactsByStatus: { status: string; count: number }[]
}
```

---

### Task 9: Contact Repository

**Files:**
- Create: `src/repositories/contact.repository.ts`

- [ ] Create `src/repositories/contact.repository.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { ContactFilters, PaginatedResult, ContactWithTags } from '@/types'

export class ContactRepository {
  async findMany(filters: ContactFilters): Promise<PaginatedResult<ContactWithTags>> {
    const {
      search, status, temperature, church, groupName, neighborhood, tagId,
      page = 1, limit = 50, orderBy = 'createdAt', order = 'desc'
    } = filters

    const where: any = { archivedAt: null }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { normalizedPhone: { contains: search } },
        { phone: { contains: search } },
        { church: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (temperature) where.temperature = temperature
    if (church) where.church = { contains: church, mode: 'insensitive' }
    if (groupName) where.groupName = { contains: groupName, mode: 'insensitive' }
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' }
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

    return { data: data as ContactWithTags[], total, page, limit, totalPages: Math.ceil(total / limit) }
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
    return prisma.contact.create({ data, include: { tags: { include: { tag: true } } } })
  }

  async update(id: string, data: any) {
    return prisma.contact.update({ where: { id }, data, include: { tags: { include: { tag: true } } } })
  }

  async delete(id: string) {
    return prisma.contact.update({ where: { id }, data: { archivedAt: new Date() } })
  }

  async getDistinctValues(field: 'church' | 'groupName' | 'neighborhood') {
    const results = await prisma.contact.findMany({
      where: { [field]: { not: null }, archivedAt: null },
      select: { [field]: true },
      distinct: [field],
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
    const [
      totalContacts, activeContacts, coldContacts, hotContacts, warmContacts,
      noResponseContacts, pendingFollowUps, todayInteractions, contactsByChurch,
      contactsByNeighborhood, contactsByStatus,
    ] = await Promise.all([
      prisma.contact.count({ where: { archivedAt: null } }),
      prisma.contact.count({ where: { status: 'ACTIVE', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'COLD', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'HOT', archivedAt: null } }),
      prisma.contact.count({ where: { temperature: 'WARM', archivedAt: null } }),
      prisma.contact.count({ where: { status: 'NO_RESPONSE', archivedAt: null } }),
      prisma.followUp.count({ where: { status: 'PENDING' } }),
      prisma.interaction.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
      }),
      prisma.contact.groupBy({
        by: ['church'],
        where: { church: { not: null }, archivedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.contact.groupBy({
        by: ['neighborhood'],
        where: { neighborhood: { not: null }, archivedAt: null },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.contact.groupBy({
        by: ['status'],
        where: { archivedAt: null },
        _count: { id: true },
      }),
    ])

    return {
      totalContacts, activeContacts, coldContacts, hotContacts, warmContacts,
      noResponseContacts, pendingFollowUps, todayInteractions, campaignsSent: 0,
      contactsByChurch: contactsByChurch.map((r: any) => ({ church: r.church, count: r._count.id })),
      contactsByNeighborhood: contactsByNeighborhood.map((r: any) => ({ neighborhood: r.neighborhood, count: r._count.id })),
      contactsByStatus: contactsByStatus.map((r: any) => ({ status: r.status, count: r._count.id })),
    }
  }
}

export const contactRepository = new ContactRepository()
```

---

### Task 10: Contact Service

**Files:**
- Create: `src/services/contact.service.ts`

- [ ] Create `src/services/contact.service.ts`:

```typescript
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
  if (digits.length === 11) return `55${digits}`
  if (digits.length === 10) return `55${digits}`
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
    if (existing) throw new Error(`Contato já existe com este telefone: ${existing.fullName}`)

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
    const { tagIds, birthDate, ...rest } = data

    const updateData: any = { ...rest }
    if (data.firstName || data.lastName) {
      const current = await contactRepository.findById(id)
      updateData.fullName = [data.firstName ?? current?.firstName, data.lastName ?? current?.lastName]
        .filter(Boolean).join(' ')
    }
    if (birthDate) updateData.birthDate = new Date(birthDate)
    if (data.phone) updateData.normalizedPhone = normalizePhone(data.phone)

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
```

---

### Task 11: Contact API Routes

**Files:**
- Create: `src/app/api/contacts/route.ts`
- Create: `src/app/api/contacts/[id]/route.ts`
- Create: `src/app/api/contacts/options/route.ts`
- Create: `src/app/api/dashboard/stats/route.ts`

- [ ] Create `src/app/api/contacts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactService, createContactSchema } from '@/services/contact.service'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const filters = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    temperature: searchParams.get('temperature') ?? undefined,
    church: searchParams.get('church') ?? undefined,
    groupName: searchParams.get('groupName') ?? undefined,
    neighborhood: searchParams.get('neighborhood') ?? undefined,
    tagId: searchParams.get('tagId') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    limit: Number(searchParams.get('limit') ?? 50),
    orderBy: searchParams.get('orderBy') ?? 'createdAt',
    order: (searchParams.get('order') ?? 'desc') as 'asc' | 'desc',
  }

  const result = await contactService.list(filters)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const contact = await contactService.create(parsed.data)
    return NextResponse.json(contact, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
}
```

- [ ] Create `src/app/api/contacts/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactService, updateContactSchema } from '@/services/contact.service'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const contact = await contactService.getById(params.id)
    return NextResponse.json(contact)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateContactSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const contact = await contactService.update(params.id, parsed.data)
    return NextResponse.json(contact)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await contactService.delete(params.id)
  return NextResponse.json({ success: true })
}
```

- [ ] Create `src/app/api/contacts/options/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactService } from '@/services/contact.service'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await contactService.getFilterOptions())
}
```

- [ ] Create `src/app/api/dashboard/stats/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { contactService } from '@/services/contact.service'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await contactService.getDashboardStats())
}
```

- [ ] Commit: `git add . && git commit -m "feat: contact CRUD API routes with filters and pagination"`

---

## Chunk 5: XLSX Import System

### Task 12: Import Service

**Files:**
- Create: `src/services/import.service.ts`
- Create: `src/app/api/imports/preview/route.ts`
- Create: `src/app/api/imports/execute/route.ts`

- [ ] Create `src/services/import.service.ts`:

```typescript
import * as XLSX from 'xlsx'
import { normalizePhone } from './contact.service'
import { prisma } from '@/lib/prisma'

export type ImportRow = {
  firstName?: string
  lastName?: string
  phone?: string
  church?: string
  groupName?: string
  neighborhood?: string
  birthDate?: string
  [key: string]: any
}

export type ColumnMapping = {
  firstName: string
  lastName?: string
  phone: string
  church?: string
  groupName?: string
  neighborhood?: string
  birthDate?: string
}

export type ImportPreview = {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
  suggestedMapping: Partial<ColumnMapping>
}

const FIELD_HINTS: Record<keyof ColumnMapping, string[]> = {
  firstName: ['primeiro', 'first', 'nome', 'name', 'primeironome'],
  lastName: ['ultimo', 'last', 'sobrenome', 'surname'],
  phone: ['telefone', 'phone', 'celular', 'whatsapp', 'fone', 'tel'],
  church: ['igreja', 'church'],
  groupName: ['grupo', 'group'],
  neighborhood: ['bairro', 'neighborhood'],
  birthDate: ['nascimento', 'birth', 'data', 'aniversario'],
}

function suggestMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {}
  const lowerHeaders = headers.map(h => h.toLowerCase().replace(/\s/g, ''))

  for (const [field, hints] of Object.entries(FIELD_HINTS)) {
    const idx = lowerHeaders.findIndex(h => hints.some(hint => h.includes(hint)))
    if (idx >= 0) (mapping as any)[field] = headers[idx]
  }

  return mapping
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<ImportPreview> {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  return {
    headers,
    rows: rows.slice(0, 5),
    totalRows: rows.length,
    suggestedMapping: suggestMapping(headers),
  }
}

export async function executeImport(
  buffer: Buffer,
  mapping: ColumnMapping,
  userId: string
): Promise<{ imported: number; updated: number; skipped: number; errors: number; errorDetails: any[] }> {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

  let imported = 0, updated = 0, skipped = 0, errors = 0
  const errorDetails: any[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const rawPhone = String(row[mapping.phone] ?? '').trim()
      if (!rawPhone || rawPhone.length < 8) { skipped++; continue }

      const firstName = String(row[mapping.firstName] ?? '').trim()
      if (!firstName) { skipped++; continue }

      const normalizedPhone = normalizePhone(rawPhone)
      const lastName = mapping.lastName ? String(row[mapping.lastName] ?? '').trim() : undefined
      const fullName = [firstName, lastName].filter(Boolean).join(' ')

      const data = {
        firstName,
        lastName: lastName || null,
        fullName,
        phone: rawPhone,
        normalizedPhone,
        church: mapping.church ? String(row[mapping.church] ?? '').trim() || null : null,
        groupName: mapping.groupName ? String(row[mapping.groupName] ?? '').trim() || null : null,
        neighborhood: mapping.neighborhood ? String(row[mapping.neighborhood] ?? '').trim() || null : null,
        source: 'import',
      }

      const existing = await prisma.contact.findUnique({ where: { normalizedPhone } })

      if (existing) {
        await prisma.contact.update({ where: { normalizedPhone }, data })
        updated++
      } else {
        await prisma.contact.create({ data })
        imported++
      }
    } catch (err: any) {
      errors++
      errorDetails.push({ row: i + 2, error: err.message })
    }
  }

  await prisma.importLog.create({
    data: { fileName: 'import.xlsx', totalRows: rows.length, imported, updated, skipped, errors, errorDetails, userId },
  })

  return { imported, updated, skipped, errors, errorDetails }
}
```

- [ ] Create `src/app/api/imports/preview/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseFile } from '@/services/import.service'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const preview = await parseFile(buffer, file.name)
  return NextResponse.json(preview)
}

export const config = { api: { bodyParser: false } }
```

- [ ] Create `src/app/api/imports/execute/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { executeImport } from '@/services/import.service'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const mappingRaw = formData.get('mapping') as string
  if (!file || !mappingRaw) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const mapping = JSON.parse(mappingRaw)
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await executeImport(buffer, mapping, session.user.id)
  return NextResponse.json(result)
}
```

- [ ] Commit: `git add . && git commit -m "feat: XLSX/CSV import service with dedup and merge"`

---

## Chunk 6: Interactions API

### Task 13: Interactions Service + API

**Files:**
- Create: `src/repositories/interaction.repository.ts`
- Create: `src/app/api/contacts/[id]/interactions/route.ts`

- [ ] Create `src/repositories/interaction.repository.ts`:

```typescript
import { prisma } from '@/lib/prisma'

export class InteractionRepository {
  async findByContact(contactId: string, limit = 50) {
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

    // Update lastContactAt on contact
    await prisma.contact.update({
      where: { id: data.contactId },
      data: { lastContactAt: new Date() },
    })

    return interaction
  }
}

export const interactionRepository = new InteractionRepository()
```

- [ ] Create `src/app/api/contacts/[id]/interactions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { interactionRepository } from '@/repositories/interaction.repository'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['WHATSAPP', 'CALL', 'VISIT', 'NOTE', 'SYSTEM']),
  message: z.string().min(1),
  summary: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const interactions = await interactionRepository.findByContact(params.id)
  return NextResponse.json(interactions)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const interaction = await interactionRepository.create({
    contactId: params.id,
    userId: session.user.id,
    ...parsed.data,
  })

  return NextResponse.json(interaction, { status: 201 })
}
```

- [ ] Commit: `git add . && git commit -m "feat: interactions API for contact timeline"`

---

## Chunk 7: Dashboard UI

### Task 14: Dashboard Page

**Files:**
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/dashboard/stats-card.tsx`
- Create: `src/components/dashboard/temperature-chart.tsx`

- [ ] Create `src/components/dashboard/stats-card.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatsCardProps = {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  variant?: 'default' | 'hot' | 'cold' | 'warm' | 'danger'
}

const variants = {
  default: 'text-purple-400 bg-purple-400/10',
  hot: 'text-red-400 bg-red-400/10',
  cold: 'text-blue-400 bg-blue-400/10',
  warm: 'text-yellow-400 bg-yellow-400/10',
  danger: 'text-orange-400 bg-orange-400/10',
}

export function StatsCard({ title, value, icon: Icon, description, variant = 'default' }: StatsCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <div className={cn('p-2 rounded-lg', variants[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString('pt-BR')}</p>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
```

- [ ] Create `src/app/(dashboard)/page.tsx`:

```tsx
import { Header } from '@/components/shared/header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { contactService } from '@/services/contact.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Flame, Snowflake, MessageSquare, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  FOLLOW_UP: 'bg-yellow-500/20 text-yellow-400',
  NO_RESPONSE: 'bg-orange-500/20 text-orange-400',
  INVALID_NUMBER: 'bg-red-500/20 text-red-400',
  DO_NOT_CONTACT: 'bg-red-700/20 text-red-600',
  CONVERTED: 'bg-blue-500/20 text-blue-400',
  LOST: 'bg-slate-600/20 text-slate-500',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  FOLLOW_UP: 'Follow-up',
  NO_RESPONSE: 'Sem resposta',
  INVALID_NUMBER: 'Nº inválido',
  DO_NOT_CONTACT: 'Não contatar',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
}

export default async function DashboardPage() {
  const stats = await contactService.getDashboardStats()

  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total de Contatos" value={stats.totalContacts} icon={Users} />
          <StatsCard title="Ativos" value={stats.activeContacts} icon={UserCheck} variant="default" />
          <StatsCard title="Quentes 🔥" value={stats.hotContacts} icon={Flame} variant="hot" />
          <StatsCard title="Frios ❄️" value={stats.coldContacts} icon={Snowflake} variant="cold" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Mornos" value={stats.warmContacts} icon={TrendingUp} variant="warm" />
          <StatsCard title="Sem resposta" value={stats.noResponseContacts} icon={AlertTriangle} variant="danger" />
          <StatsCard title="Follow-ups pendentes" value={stats.pendingFollowUps} icon={Calendar} />
          <StatsCard title="Atendimentos hoje" value={stats.todayInteractions} icon={MessageSquare} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status breakdown */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={statusColors[status] ?? 'bg-slate-500/20 text-slate-400'}>
                    {statusLabels[status] ?? status}
                  </Badge>
                  <span className="text-white font-semibold text-sm">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By church */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Igreja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByChurch.slice(0, 8).map(({ church, count }) => (
                <div key={church} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate">{church}</span>
                  <span className="text-white font-semibold text-sm ml-2">{count}</span>
                </div>
              ))}
              {stats.contactsByChurch.length === 0 && (
                <p className="text-slate-500 text-sm">Nenhum dado</p>
              )}
            </CardContent>
          </Card>

          {/* By neighborhood */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Bairro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByNeighborhood.slice(0, 8).map(({ neighborhood, count }) => (
                <div key={neighborhood} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate">{neighborhood}</span>
                  <span className="text-white font-semibold text-sm ml-2">{count}</span>
                </div>
              ))}
              {stats.contactsByNeighborhood.length === 0 && (
                <p className="text-slate-500 text-sm">Nenhum dado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] Commit: `git add . && git commit -m "feat: dashboard page with real stats from database"`

---

## Chunk 8: Contact List UI

### Task 15: Contacts List Page with TanStack Table

**Files:**
- Create: `src/app/(dashboard)/contatos/page.tsx`
- Create: `src/components/contacts/contacts-table.tsx`
- Create: `src/components/contacts/contact-filters.tsx`
- Create: `src/components/contacts/import-dialog.tsx`

- [ ] Create `src/app/(dashboard)/contatos/page.tsx`:

```tsx
import { Header } from '@/components/shared/header'
import { ContactsTable } from '@/components/contacts/contacts-table'

export default function ContactsPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Contatos" />
      <div className="flex-1 p-6">
        <ContactsTable />
      </div>
    </div>
  )
}
```

- [ ] Create `src/components/contacts/contacts-table.tsx` — full TanStack Table with:
  - Columns: select, name, phone, church, neighborhood, status badge, temperature badge, score, last contact, actions
  - Server-side pagination and filtering via API
  - Bulk select + bulk actions (delete, change status, add tag)
  - Export to CSV
  - Import button → opens ImportDialog
  - Row click → navigate to contact profile

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type Row
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ImportDialog } from './import-dialog'
import { UserPlus, Download, Search, ChevronLeft, ChevronRight, Flame, Snowflake, Thermometer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Contact = {
  id: string
  fullName: string
  phone: string
  normalizedPhone: string
  church: string | null
  neighborhood: string | null
  status: string
  temperature: string
  score: number
  lastContactAt: string | null
  tags: { tag: { id: string; name: string; color: string } }[]
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  FOLLOW_UP: 'bg-yellow-500/20 text-yellow-400',
  NO_RESPONSE: 'bg-orange-500/20 text-orange-400',
  INVALID_NUMBER: 'bg-red-500/20 text-red-400',
  DO_NOT_CONTACT: 'bg-red-700/20 text-red-600',
  CONVERTED: 'bg-blue-500/20 text-blue-400',
  LOST: 'bg-slate-600/20 text-slate-500',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', FOLLOW_UP: 'Follow-up',
  NO_RESPONSE: 'Sem resposta', INVALID_NUMBER: 'Nº inválido',
  DO_NOT_CONTACT: 'Não contatar', CONVERTED: 'Convertido', LOST: 'Perdido',
}

const TempIcon = ({ temp }: { temp: string }) => {
  if (temp === 'HOT') return <Flame className="h-3 w-3 text-red-400" />
  if (temp === 'COLD') return <Snowflake className="h-3 w-3 text-blue-400" />
  return <Thermometer className="h-3 w-3 text-yellow-400" />
}

export function ContactsTable() {
  const router = useRouter()
  const [data, setData] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tempFilter, setTempFilter] = useState('all')
  const [rowSelection, setRowSelection] = useState({})
  const [importOpen, setImportOpen] = useState(false)
  const limit = 50

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(tempFilter !== 'all' && { temperature: tempFilter }),
      })
      const res = await fetch(`/api/contacts?${params}`)
      const json = await res.json()
      setData(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, tempFilter])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const columns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="border-slate-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          className="border-slate-600"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      accessorKey: 'fullName',
      header: 'Nome',
      cell: ({ row }) => (
        <div>
          <p className="text-white font-medium text-sm">{row.original.fullName}</p>
          <p className="text-slate-500 text-xs">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'church',
      header: 'Igreja',
      cell: ({ row }) => <span className="text-slate-300 text-sm">{row.original.church ?? '—'}</span>,
    },
    {
      accessorKey: 'neighborhood',
      header: 'Bairro',
      cell: ({ row }) => <span className="text-slate-300 text-sm">{row.original.neighborhood ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={cn('text-xs', statusColors[row.original.status])}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'temperature',
      header: 'Temp.',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <TempIcon temp={row.original.temperature} />
          <span className="text-slate-300 text-xs">{row.original.score}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {row.original.tags.slice(0, 3).map(({ tag }) => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color + '33', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {row.original.tags.length > 3 && (
            <span className="text-xs text-slate-500">+{row.original.tags.length - 3}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'lastContactAt',
      header: 'Último contato',
      cell: ({ row }) => (
        <span className="text-slate-400 text-xs">
          {row.original.lastContactAt
            ? new Date(row.original.lastContactAt).toLocaleDateString('pt-BR')
            : '—'}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    manualPagination: true,
    pageCount: totalPages,
  })

  const selectedIds = table.getSelectedRowModel().rows.map(r => r.original.id)

  function exportCSV() {
    const rows = [
      ['Nome', 'Telefone', 'Igreja', 'Bairro', 'Status', 'Temperatura'],
      ...data.map(c => [c.fullName, c.phone, c.church ?? '', c.neighborhood ?? '', c.status, c.temperature]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contatos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nome, telefone, igreja..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tempFilter} onValueChange={(v) => { setTempFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="HOT">🔥 Quente</SelectItem>
            <SelectItem value="WARM">🌡️ Morno</SelectItem>
            <SelectItem value="COLD">❄️ Frio</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          {selectedIds.length > 0 && (
            <span className="text-slate-400 text-sm">{selectedIds.length} selecionados</span>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-slate-700 text-slate-300 hover:text-white">
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="h-4 w-4 mr-1" /> Importar
          </Button>
          <Button size="sm" onClick={() => router.push('/contatos/novo')} className="bg-slate-700 hover:bg-slate-600">
            + Novo
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-slate-700 bg-slate-800/50">
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="text-slate-400 text-xs font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400 py-12">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-400 py-12">
                  Nenhum contato encontrado
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                className="border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/contatos/${row.original.id}`)}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {total} contatos • Página {page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-slate-700 text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-slate-700 text-slate-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={fetchContacts} />
    </div>
  )
}
```

- [ ] Create `src/components/contacts/import-dialog.tsx`:

```tsx
'use client'

import { useState, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

type Props = { open: boolean; onClose: () => void; onSuccess: () => void }

type Preview = {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
  suggestedMapping: Record<string, string>
}

const FIELDS = [
  { key: 'firstName', label: 'Primeiro Nome *', required: true },
  { key: 'lastName', label: 'Sobrenome', required: false },
  { key: 'phone', label: 'Telefone *', required: true },
  { key: 'church', label: 'Igreja', required: false },
  { key: 'groupName', label: 'Grupo', required: false },
  { key: 'neighborhood', label: 'Bairro', required: false },
  { key: 'birthDate', label: 'Data de Nascimento', required: false },
]

export function ImportDialog({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'done'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(f: File) {
    setFile(f)
    const fd = new FormData()
    fd.append('file', f)
    const res = await fetch('/api/imports/preview', { method: 'POST', body: fd })
    const data = await res.json()
    setPreview(data)
    setMapping(data.suggestedMapping ?? {})
    setStep('map')
  }

  async function handleImport() {
    if (!file) return
    setStep('importing')
    setProgress(30)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('mapping', JSON.stringify(mapping))

    setProgress(60)
    const res = await fetch('/api/imports/execute', { method: 'POST', body: fd })
    const data = await res.json()
    setProgress(100)
    setResult(data)
    setStep('done')
    onSuccess()
    toast.success(`Importação concluída: ${data.imported} novos, ${data.updated} atualizados`)
  }

  function handleClose() {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setMapping({})
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription className="text-slate-400">
            Importe sua planilha Excel ou CSV
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleFileSelect(f)
            }}
          >
            <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-white font-medium">Arraste sua planilha aqui</p>
            <p className="text-slate-400 text-sm mt-1">ou clique para selecionar</p>
            <p className="text-slate-500 text-xs mt-2">XLSX, XLS, CSV</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
          </div>
        )}

        {step === 'map' && preview && (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              <span className="font-medium text-white">{preview.totalRows}</span> linhas detectadas.
              Mapeie as colunas:
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <Label className="w-48 text-slate-300 text-sm flex-shrink-0">{label}</Label>
                  <Select value={mapping[key] ?? ''} onValueChange={(v) => setMapping(m => ({ ...m, [key]: v }))}>
                    <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-slate-200">
                      <SelectValue placeholder="Selecionar coluna..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {!required && <SelectItem value="">— Ignorar —</SelectItem>}
                      {preview.headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep('upload')} className="border-slate-600 text-slate-300">
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!mapping.firstName || !mapping.phone}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="h-4 w-4 mr-2" /> Importar {preview.totalRows} contatos
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-4">
            <p className="text-slate-300 text-center">Importando contatos...</p>
            <Progress value={progress} className="bg-slate-700" />
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Importados', value: result.imported, color: 'text-green-400' },
                { label: 'Atualizados', value: result.updated, color: 'text-blue-400' },
                { label: 'Ignorados', value: result.skipped, color: 'text-slate-400' },
                { label: 'Erros', value: result.errors, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-slate-400 text-sm">{label}</p>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="w-full bg-purple-600 hover:bg-purple-700">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] Commit: `git add . && git commit -m "feat: contacts list page with TanStack Table, filters, and import dialog"`

---

## Chunk 9: Contact Profile + Timeline

### Task 16: Contact Profile Page

**Files:**
- Create: `src/app/(dashboard)/contatos/[id]/page.tsx`
- Create: `src/components/contacts/interaction-timeline.tsx`
- Create: `src/components/contacts/add-interaction-form.tsx`

- [ ] Create `src/app/(dashboard)/contatos/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { contactService } from '@/services/contact.service'
import { Header } from '@/components/shared/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InteractionTimeline } from '@/components/contacts/interaction-timeline'
import { AddInteractionForm } from '@/components/contacts/add-interaction-form'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, MapPin, Church, Users, Calendar, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const tempColors: Record<string, string> = {
  HOT: 'bg-red-500/20 text-red-400',
  WARM: 'bg-yellow-500/20 text-yellow-400',
  COLD: 'bg-blue-500/20 text-blue-400',
}
const tempLabels: Record<string, string> = { HOT: '🔥 Quente', WARM: '🌡️ Morno', COLD: '❄️ Frio' }

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  FOLLOW_UP: 'bg-yellow-500/20 text-yellow-400',
  NO_RESPONSE: 'bg-orange-500/20 text-orange-400',
  INVALID_NUMBER: 'bg-red-500/20 text-red-400',
  DO_NOT_CONTACT: 'bg-red-700/20 text-red-600',
  CONVERTED: 'bg-blue-500/20 text-blue-400',
  LOST: 'bg-slate-600/20 text-slate-500',
}
const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', FOLLOW_UP: 'Follow-up',
  NO_RESPONSE: 'Sem resposta', INVALID_NUMBER: 'Nº inválido',
  DO_NOT_CONTACT: 'Não contatar', CONVERTED: 'Convertido', LOST: 'Perdido',
}

export default async function ContactProfilePage({ params }: { params: { id: string } }) {
  let contact: any
  try {
    contact = await contactService.getById(params.id)
  } catch {
    notFound()
  }

  const initials = contact.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Perfil do Contato" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Contact Info */}
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarFallback className="bg-purple-600 text-white text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="text-white font-bold text-lg">{contact.fullName}</h2>
                <div className="flex gap-2 mt-2 flex-wrap justify-center">
                  <Badge className={statusColors[contact.status]}>{statusLabels[contact.status]}</Badge>
                  <Badge className={tempColors[contact.temperature]}>{tempLabels[contact.temperature]}</Badge>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-sm font-semibold">{contact.score} pts</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span>{contact.phone}</span>
                </div>
                {contact.church && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Church className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{contact.church}</span>
                  </div>
                )}
                {contact.groupName && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{contact.groupName}</span>
                  </div>
                )}
                {contact.neighborhood && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{contact.neighborhood}{contact.city ? `, ${contact.city}` : ''}</span>
                  </div>
                )}
                {contact.birthDate && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{format(new Date(contact.birthDate), "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Tags</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {contact.tags.map(({ tag }: any) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: tag.color + '33', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {contact.notes && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Observações</CardTitle></CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Cadastrado em</span>
                <span>{format(new Date(contact.createdAt), 'dd/MM/yyyy')}</span>
              </div>
              {contact.lastContactAt && (
                <div className="flex justify-between">
                  <span>Último contato</span>
                  <span>{format(new Date(contact.lastContactAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Origem</span>
                <span>{contact.source ?? 'manual'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <AddInteractionForm contactId={contact.id} />
          <InteractionTimeline contactId={contact.id} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] Create `src/components/contacts/add-interaction-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { MessageSquare, Phone, MapPin, FileText, Send } from 'lucide-react'
import { toast } from 'sonner'

type Props = { contactId: string }

const typeOptions = [
  { value: 'NOTE', label: 'Observação', icon: FileText },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { value: 'CALL', label: 'Ligação', icon: Phone },
  { value: 'VISIT', label: 'Visita', icon: MapPin },
]

export function AddInteractionForm({ contactId }: Props) {
  const [type, setType] = useState('NOTE')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      })

      if (!res.ok) throw new Error('Erro ao registrar')

      setMessage('')
      toast.success('Interação registrada')
      window.dispatchEvent(new CustomEvent('interaction-added'))
    } catch {
      toast.error('Erro ao registrar interação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {typeOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Registrar interação, observação ou mensagem enviada..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !message.trim()} size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Send className="h-3 w-3 mr-2" />
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] Create `src/components/contacts/interaction-timeline.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Phone, MapPin, FileText, Settings, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Interaction = {
  id: string
  type: string
  message: string
  createdAt: string
  user: { name: string | null; email: string } | null
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  NOTE: { icon: FileText, label: 'Observação', color: 'text-slate-400 bg-slate-400/10' },
  WHATSAPP: { icon: MessageSquare, label: 'WhatsApp', color: 'text-green-400 bg-green-400/10' },
  CALL: { icon: Phone, label: 'Ligação', color: 'text-blue-400 bg-blue-400/10' },
  VISIT: { icon: MapPin, label: 'Visita', color: 'text-purple-400 bg-purple-400/10' },
  SYSTEM: { icon: Settings, label: 'Sistema', color: 'text-slate-500 bg-slate-500/10' },
}

export function InteractionTimeline({ contactId }: { contactId: string }) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch(`/api/contacts/${contactId}/interactions`)
    const data = await res.json()
    setInteractions(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('interaction-added', handler)
    return () => window.removeEventListener('interaction-added', handler)
  }, [contactId])

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timeline de Relacionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : interactions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Nenhuma interação registrada ainda</p>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction, idx) => {
              const config = typeConfig[interaction.type] ?? typeConfig.NOTE
              const Icon = config.icon
              const userName = interaction.user?.name ?? interaction.user?.email ?? 'Sistema'
              const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <div key={interaction.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-1.5 rounded-full ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {idx < interactions.length - 1 && (
                      <div className="w-px flex-1 bg-slate-700 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-400">{config.label}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                      {interaction.user && (
                        <>
                          <span className="text-xs text-slate-600">•</span>
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="bg-purple-600 text-white text-[8px]">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">{userName}</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{interaction.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] Commit: `git add . && git commit -m "feat: contact profile page with interaction timeline"`

---

## Chunk 10: Final Polish + Run

### Task 17: App Config + Toaster + Utils

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`

- [ ] Update `src/app/layout.tsx` to add Toaster and dark background:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GrupoWhats CRM',
  description: 'CRM de relacionamento via WhatsApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
```

- [ ] Ensure `src/lib/utils.ts` has cn utility:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### Task 18: Start and Verify

- [ ] Start Docker: `docker-compose up -d`
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Run seed: `npx prisma db seed`
- [ ] Start dev server: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Login with `admin@grupowhats.com` / `admin123`
- [ ] Verify: dashboard loads with stats
- [ ] Verify: contacts page loads table
- [ ] Verify: import dialog opens
- [ ] Verify: contact profile + timeline work
- [ ] Final commit: `git add . && git commit -m "feat: complete Phase 1 CRM - dashboard, contacts, import, timeline"`

---

## Notes for Phase 2 (WhatsApp + Campaigns)

Planned but not in this plan:
- `src/services/whatsapp.service.ts` — Evolution API integration
- `src/app/api/whatsapp/sessions/route.ts` — session management
- `src/app/(dashboard)/campanhas/page.tsx` — campaign builder
- `src/lib/queue.ts` — BullMQ setup
- Anti-ban: randomized delays, daily limits, warm-up schedule
