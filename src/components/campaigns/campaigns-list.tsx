'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Megaphone, Users, PlayCircle, PauseCircle, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Campaign = {
  id: string
  name: string
  description: string | null
  status: string
  scheduledAt: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  createdBy: { name: string | null } | null
  _count: { campaignContacts: number }
  campaignContacts: { status: string }[]
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  SCHEDULED: 'bg-blue-500/20 text-blue-400',
  RUNNING: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-yellow-500/20 text-yellow-400',
  FINISHED: 'bg-purple-500/20 text-purple-400',
  CANCELED: 'bg-red-500/20 text-red-400',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', SCHEDULED: 'Agendada', RUNNING: 'Enviando',
  PAUSED: 'Pausada', FINISHED: 'Finalizada', CANCELED: 'Cancelada',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'RUNNING') return <PlayCircle className="h-4 w-4 text-green-400" />
  if (status === 'PAUSED') return <PauseCircle className="h-4 w-4 text-yellow-400" />
  if (status === 'FINISHED') return <CheckCircle className="h-4 w-4 text-purple-400" />
  if (status === 'SCHEDULED') return <Clock className="h-4 w-4 text-blue-400" />
  return <Megaphone className="h-4 w-4 text-slate-400" />
}

export function CampaignsList() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/campaigns${params}`)
    setCampaigns(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-slate-300">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(statusLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => router.push('/campanhas/nova')} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-1" /> Nova Campanha
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : campaigns.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">Nenhuma campanha criada ainda</p>
            <Button onClick={() => router.push('/campanhas/nova')} className="bg-purple-600 hover:bg-purple-700">
              Criar primeira campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const sent = c.campaignContacts.filter(cc => ['SENT', 'DELIVERED', 'READ', 'REPLIED'].includes(cc.status)).length
            const total = c._count.campaignContacts
            const pct = total > 0 ? Math.round((sent / total) * 100) : 0
            return (
              <Card key={c.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                onClick={() => router.push(`/campanhas/${c.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <StatusIcon status={c.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-medium text-sm">{c.name}</h3>
                          <Badge className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                        </div>
                        {c.description && <p className="text-slate-400 text-xs mt-0.5 truncate">{c.description}</p>}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Users className="h-3 w-3" />
                            {total} contatos
                          </div>
                          {total > 0 && (
                            <div className="text-xs text-slate-500">
                              {sent} enviados ({pct}%)
                            </div>
                          )}
                          <div className="text-xs text-slate-600">
                            {format(new Date(c.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {total > 0 && (
                      <div className="w-16 text-right">
                        <div className="text-lg font-bold text-white">{pct}%</div>
                        <div className="text-xs text-slate-500">enviado</div>
                      </div>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
