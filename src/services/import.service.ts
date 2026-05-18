import * as XLSX from 'xlsx'
import { normalizePhone } from './contact.service'
import { prisma } from '@/lib/prisma'

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

  // 2. ONE query to find all existing phones
  const allPhones = validRows.map(r => r.data.normalizedPhone)
  const existing = await prisma.contact.findMany({
    where: { normalizedPhone: { in: allPhones } },
    select: { normalizedPhone: true },
  })
  const existingSet = new Set(existing.map(c => c.normalizedPhone))

  // 3. Split into new vs existing
  const newRows = validRows.filter(r => !existingSet.has(r.data.normalizedPhone))
  const updateRows = validRows.filter(r => existingSet.has(r.data.normalizedPhone))

  // 4. Batch create all new records in ONE query
  if (newRows.length > 0) {
    try {
      const result = await prisma.contact.createMany({ data: newRows.map(r => r.data), skipDuplicates: true })
      imported = result.count
    } catch (err: any) {
      errors += newRows.length
      errorDetails.push({ row: 'batch_create', error: err.message })
    }
  }

  // 5. Update existing in parallel batches of 50
  const CHUNK = 50
  for (let i = 0; i < updateRows.length; i += CHUNK) {
    const chunk = updateRows.slice(i, i + CHUNK)
    const results = await Promise.all(
      chunk.map(r =>
        prisma.contact.update({ where: { normalizedPhone: r.data.normalizedPhone }, data: r.data })
          .then(() => true)
          .catch((err: any) => { errorDetails.push({ row: r.rowIndex, error: err.message }); return false })
      )
    )
    const succeeded = results.filter(Boolean).length
    updated += succeeded
    errors += chunk.length - succeeded
  }

  await prisma.importLog.create({
    data: { fileName: 'import.xlsx', totalRows: rows.length, imported, updated, skipped, errors, errorDetails, userId },
  })

  return { imported, updated, skipped, errors, errorDetails }
}
