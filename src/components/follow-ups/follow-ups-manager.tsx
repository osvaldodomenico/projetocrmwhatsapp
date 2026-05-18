'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Clock, AlertTriangle, Flame, ChevronRight, User } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'

type FollowUp = {
  id: string
  dueDate: string
  priority: string
  status: string
  notes: string | null
  contact: { id: string; fullName: string; phone: string; church: string | null }
  user: { name: string | null } | null
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-400',
  MEDIUM: 'bg-blue-500/20 text-blue-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  URGENT: 'bg-red-500/20 text-red-400',
}
const priorityLabels: Record<string, string> = {
  LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente',
}

export function FollowUpsManager() {
  const [items, setItems] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING')

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/follow-ups?status=${statusFilter}`)
    setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  async function markDone(id: string) {
    await fetch(`/api/follow-ups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DONE' }),
    })
    toast.success('Follow-up concluído!')
    load()
  }

  async function cancel(id: string) {
    await fetch(`/api/follow-ups/${id}`, { method: 'DELETE' })
    toast.success('Follow-up cancelado')
    load()
  }

  const overdue = items.filter(f => isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate)))
  const todayItems = items.filter(f => isToday(new Date(f.dueDate)))
  const upcoming = items.filter(f => !isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate)))

  function renderItem(item: FollowUp) {
    const due = new Date(item.dueDate)
    const isOverdue = isPast(due) && !isToday(due)
    return (
      <Card key={item.id} className={`bg-slate-800/50 border-slate-700 ${isOverdue ? 'border-red-500/30' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <Link href={`/contatos/${item.contact.id}`}
                className="text-white font-medium text-sm hover:text-purple-400 transition-colors flex items-center gap-1">
                {item.contact.fullName}
                <ChevronRight className="h-3 w-3" />
              </Link>
              <p className="text-slate-500 text-xs mt-0.5">{item.contact.phone}{item.contact.church ? ` • ${item.contact.church}` : ''}</p>
              {item.notes && <p className="text-slate-300 text-sm mt-2">{item.notes}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={priorityColors[item.priority]}>{priorityLabels[item.priority]}</Badge>
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : isToday(due) ? 'text-yellow-400' : 'text-slate-400'}`}>
                  <Clock className="h-3 w-3" />
                  {format(due, "dd/MM/yyyy", { locale: ptBR })}
                  {isOverdue && ' (atrasado)'}
                  {isToday(due) && ' (hoje)'}
                </div>
                {item.user?.name && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    {item.user.name}
                  </div>
                )}
              </div>
            </div>
            {statusFilter === 'PENDING' && (
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={() => markDone(item.id)}
                  className="bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 h-7 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => cancel(item.id)}
                  className="text-slate-500 hover:text-red-400 h-7 text-xs">
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="DONE">Concluídos</SelectItem>
            <SelectItem value="CANCELED">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-slate-400 text-sm">{items.length} follow-ups</span>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Nenhum follow-up {statusFilter === 'PENDING' ? 'pendente' : statusFilter === 'DONE' ? 'concluído' : 'cancelado'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h3 className="text-red-400 font-medium text-sm">Atrasados ({overdue.length})</h3>
              </div>
              <div className="space-y-2">{overdue.map(renderItem)}</div>
            </div>
          )}
          {todayItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-yellow-400" />
                <h3 className="text-yellow-400 font-medium text-sm">Para hoje ({todayItems.length})</h3>
              </div>
              <div className="space-y-2">{todayItems.map(renderItem)}</div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-slate-400 font-medium text-sm">Próximos ({upcoming.length})</h3>
              </div>
              <div className="space-y-2">{upcoming.map(renderItem)}</div>
            </div>
          )}
          {statusFilter !== 'PENDING' && (
            <div className="space-y-2">{items.map(renderItem)}</div>
          )}
        </div>
      )}
    </div>
  )
}
