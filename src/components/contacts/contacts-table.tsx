'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable, getCoreRowModel, flexRender, type ColumnDef
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImportDialog } from './import-dialog'
import { Download, Search, ChevronLeft, ChevronRight, Flame, Snowflake, Thermometer, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Contact = {
  id: string
  fullName: string
  phone: string
  church: string | null
  neighborhood: string | null
  status: string
  temperature: string
  score: number
  lastContactAt: string | null
  tags: { tag: { id: string; name: string; color: string } }[]
}

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

function TempIcon({ temp }: { temp: string }) {
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
      setData(json.data ?? [])
      setTotal(json.total ?? 0)
      setTotalPages(json.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, tempFilter, limit])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  const columns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          className="border-slate-600" />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          className="border-slate-600"
          onClick={(e) => e.stopPropagation()} />
      ),
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
            <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color + '33', color: tag.color }}>
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

  function exportCSV() {
    const rows = [
      ['Nome', 'Telefone', 'Igreja', 'Bairro', 'Status', 'Temperatura'],
      ...data.map(c => [c.fullName, c.phone, c.church ?? '', c.neighborhood ?? '', c.status, c.temperature]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contatos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar nome, telefone, igreja..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? 'all'); setPage(1) }}>
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

        <Select value={tempFilter} onValueChange={(v) => { setTempFilter(v ?? 'all'); setPage(1) }}>
          <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue placeholder="Temperatura" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="HOT">Quente</SelectItem>
            <SelectItem value="WARM">Morno</SelectItem>
            <SelectItem value="COLD">Frio</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          {selectedCount > 0 && (
            <span className="text-slate-400 text-sm">{selectedCount} selecionados</span>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV}
            className="border-slate-700 text-slate-300 hover:text-white">
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" onClick={() => setImportOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <UserPlus className="h-4 w-4 mr-1" /> Importar
          </Button>
          <Button size="sm" onClick={() => router.push('/contatos/novo')}
            className="bg-slate-700 hover:bg-slate-600 text-white">
            + Novo
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-slate-700 bg-slate-800/50 hover:bg-slate-800/50">
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
              <TableRow key={row.id}
                className="border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/contatos/${row.original.id}`)}>
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

      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">
          {total} contatos • Página {page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1} className="border-slate-700 text-slate-300">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages} className="border-slate-700 text-slate-300">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={fetchContacts} />
    </div>
  )
}
