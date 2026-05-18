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

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const rawPhone = String(row[mapping.phone] ?? '').trim()
      if (!rawPhone || rawPhone.length < 8) { skipped++; continue }

      const firstName = String(row[mapping.firstName] ?? '').trim()
      if (!firstName) { skipped++; continue }

      const normalizedPhone = normalizePhone(rawPhone)
      const lastName = mapping.lastName ? String(row[mapping.lastName] ?? '').trim() || undefined : undefined
      const fullName = [firstName, lastName].filter(Boolean).join(' ')

      const data: any = {
        firstName,
        lastName: lastName ?? null,
        fullName,
        phone: rawPhone,
        normalizedPhone,
        source: 'import',
      }

      if (mapping.church) {
        const v = String(row[mapping.church] ?? '').trim()
        if (v) data.church = v
      }
      if (mapping.groupName) {
        const v = String(row[mapping.groupName] ?? '').trim()
        if (v) data.groupName = v
      }
      if (mapping.neighborhood) {
        const v = String(row[mapping.neighborhood] ?? '').trim()
        if (v) data.neighborhood = v
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
    data: {
      fileName: 'import.xlsx',
      totalRows: rows.length,
      imported,
      updated,
      skipped,
      errors,
      errorDetails,
      userId,
    },
  })

  return { imported, updated, skipped, errors, errorDetails }
}
