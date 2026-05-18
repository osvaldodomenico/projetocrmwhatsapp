import * as XLSX from 'xlsx'
import { normalizePhone } from './contact.service'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

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

export async function parseFile(buffer: Buffer, _fileName: string): Promise<ImportPreview> {
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

  // 1. Parse and validate all rows in memory (no DB yet)
  type ContactData = {
    firstName: string
    lastName: string | null
    fullName: string
    phone: string
    normalizedPhone: string
    source: string
    church?: string
    groupName?: string
    neighborhood?: string
  }
  const validRows: { rowIndex: number; data: ContactData }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rawPhone = String(row[mapping.phone] ?? '').trim()
    if (!rawPhone || rawPhone.length < 8) { skipped++; continue }

    const firstName = String(row[mapping.firstName] ?? '').trim()
    if (!firstName) { skipped++; continue }

    const normalizedPhone = normalizePhone(rawPhone)
    const lastName = mapping.lastName ? String(row[mapping.lastName] ?? '').trim() || null : null
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    const data: ContactData = { firstName, lastName, fullName, phone: rawPhone, normalizedPhone, source: 'import' }

    if (mapping.church) { const v = String(row[mapping.church] ?? '').trim(); if (v) data.church = v }
    if (mapping.groupName) { const v = String(row[mapping.groupName] ?? '').trim(); if (v) data.groupName = v }
    if (mapping.neighborhood) { const v = String(row[mapping.neighborhood] ?? '').trim(); if (v) data.neighborhood = v }

    validRows.push({ rowIndex: i + 2, data })
  }

  if (validRows.length === 0) {
    await prisma.importLog.create({
      data: { fileName: 'import.xlsx', totalRows: rows.length, imported, updated, skipped, errors, errorDetails, userId },
    })
    return { imported, updated, skipped, errors, errorDetails }
  }

  // 2. Bulk upsert via INSERT ... ON DUPLICATE KEY UPDATE (1 query per 500 rows)
  // New rows get a new id; existing rows preserve their id via "id = id"
  const BATCH_SIZE = 500
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE)
    try {
      const values = batch.map(r => Prisma.sql`(
        ${crypto.randomUUID()},
        ${r.data.firstName},
        ${r.data.lastName ?? null},
        ${r.data.fullName},
        ${r.data.phone},
        ${r.data.normalizedPhone},
        ${r.data.source},
        ${r.data.church ?? null},
        ${r.data.groupName ?? null},
        ${r.data.neighborhood ?? null},
        NOW(),
        NOW()
      )`)

      const result = await prisma.$executeRaw`
        INSERT INTO crmwhatsapp_contacts
          (id, firstName, lastName, fullName, phone, normalizedPhone, source, church, groupName, neighborhood, createdAt, updatedAt)
        VALUES ${Prisma.join(values)}
        ON DUPLICATE KEY UPDATE
          id         = id,
          firstName  = VALUES(firstName),
          lastName   = VALUES(lastName),
          fullName   = VALUES(fullName),
          phone      = VALUES(phone),
          source     = VALUES(source),
          church     = VALUES(church),
          groupName  = VALUES(groupName),
          neighborhood = VALUES(neighborhood),
          updatedAt  = NOW()
      `
      // MySQL ON DUPLICATE KEY UPDATE returns 1 for insert, 2 for update, 0 if row unchanged
      // result = total affected rows (not reliable for imported/updated split, so we track differently)
      imported += batch.length // will correct below
    } catch (err: any) {
      errors += batch.length
      errorDetails.push({ row: `batch_${i}`, error: err.message })
    }
  }

  // Approximate: total valid - errors = processed
  imported = validRows.length - skipped - errors

  await prisma.importLog.create({
    data: { fileName: 'import.xlsx', totalRows: rows.length, imported, updated, skipped, errors, errorDetails, userId },
  })

  return { imported, updated, skipped, errors, errorDetails }
}
