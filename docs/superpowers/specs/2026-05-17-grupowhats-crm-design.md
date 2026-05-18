# GrupoWhats CRM — Design Spec
**Date:** 2026-05-17
**Status:** Approved by user

---

## Overview

WhatsApp CRM system for contact management, relationship tracking, bulk messaging, and campaign management. Focused on political/religious/community CRM use cases. Enterprise-grade architecture, runs on localhost initially.

---

## Approach

Next.js 15 fullstack (App Router + API Routes) with Prisma + PostgreSQL + Redis. Single monorepo for speed to market. Architecture clean enough for future NestJS backend separation.

---

## Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS, shadcn/ui, Zustand, React Hook Form, Zod, TanStack Table
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL, NextAuth v5
- **Queue**: BullMQ + Redis
- **WhatsApp**: Evolution API
- **Infrastructure**: Docker Compose (PostgreSQL + Redis)

---

## Project Structure

```
grupowhats/
├── docker-compose.yml
├── .env.local
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── contatos/
│   │   │   ├── campanhas/
│   │   │   ├── follow-ups/
│   │   │   └── configuracoes/
│   │   └── api/
│   │       ├── auth/
│   │       ├── contacts/
│   │       ├── campaigns/
│   │       ├── interactions/
│   │       ├── imports/
│   │       └── webhooks/
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── contacts/
│   │   ├── dashboard/
│   │   ├── campaigns/
│   │   └── shared/
│   ├── services/
│   │   ├── contact.service.ts
│   │   ├── campaign.service.ts
│   │   ├── interaction.service.ts
│   │   ├── import.service.ts
│   │   └── whatsapp.service.ts
│   ├── repositories/
│   │   ├── contact.repository.ts
│   │   ├── campaign.repository.ts
│   │   └── interaction.repository.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── queue.ts
│   │   └── utils.ts
│   ├── types/index.ts
│   └── hooks/
│       ├── useContacts.ts
│       └── useCampaigns.ts
```

---

## Database Schema

### contacts
- id, first_name, last_name, full_name (computed), phone, normalized_phone
- church, group_name, neighborhood, city, state, birth_date
- notes, avatar, source, status (enum), lead_temperature (enum)
- score (Int default 0), last_contact_at, next_followup_at
- opt_out, archived_at, created_at, updated_at

### Enums
- ContactStatus: ACTIVE, INACTIVE, FOLLOW_UP, NO_RESPONSE, INVALID_NUMBER, DO_NOT_CONTACT, CONVERTED, LOST
- LeadTemperature: COLD, WARM, HOT
- InteractionType: WHATSAPP, CALL, VISIT, NOTE, SYSTEM
- CampaignStatus: DRAFT, SCHEDULED, RUNNING, PAUSED, FINISHED, CANCELED
- FollowUpPriority: LOW, MEDIUM, HIGH, URGENT
- FollowUpStatus: PENDING, DONE, CANCELED
- MessageDirection: INBOUND, OUTBOUND
- MessageType: TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, LOCATION, STICKER

### tags + contact_tags (many-to-many)
### interactions (timeline)
### follow_ups
### campaigns + campaign_contacts
### whatsapp_messages
### whatsapp_sessions
### audit_logs
### import_logs

---

## Delivery Phases

### Phase 1 — Today (ready for tomorrow morning)
1. Docker Compose (PostgreSQL + Redis)
2. Next.js 15 project scaffold + all dependencies
3. Prisma schema complete + migrations + seeds
4. NextAuth v5 (email/password login)
5. Contact CRUD (create, read, update, delete, archive)
6. XLSX/CSV import with preview, column mapping, dedup
7. Contact list with TanStack Table (filters, search, bulk select, export)
8. Dashboard with real metrics
9. Contact profile page with interaction timeline
10. Manual interaction recording

### Phase 2 — This week
1. Evolution API integration + WhatsApp session management
2. Individual message sending from contact profile
3. Campaign builder + bulk sending
4. BullMQ queues + anti-ban (randomized delays, daily limits, warm-up)

### Phase 3 — Future
1. Follow-up automation
2. AI scoring + sentiment analysis
3. Multi-agent / chatbot hybrid
4. Advanced analytics

---

## Anti-Ban Strategy

- Randomized delay between messages (configurable min/max, e.g., 20s–90s)
- Daily/hourly send limits per session
- Gradual warm-up schedule (30/60/100 messages per day)
- Simulated typing indicator
- Message variation with dynamic variables ({{first_name}})
- Automatic pause on high error rate
- Cooldown periods

---

## Key UX Principles

- SaaS premium (Hubspot/Kommo CRM references)
- Dark mode support
- Full responsiveness
- Loading states + error boundaries everywhere
- Optimistic updates on mutations
