'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Play, Pause, Users, MessageSquare, CheckCircle, XCircle, Clock, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

type Campaign = {
  id: string
  name: string
  description: string | null
  messageTemplate: string
  status: string
  minDelay: number
  maxDelay: number
  dailyLimit: number
  startedAt: string | null
  finishedAt: string | null
  createdBy: { name: string | null } | null
  campaignContacts: {
    status: string
    contact: { id: string; fullName: string; phone: string; status: string }
  }[]
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  RUNNING: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-yellow-500/20 text-yellow-400',
  FINISHED: 'bg-purple-500/20 text-purple-400',
  CANCELED: 'bg-red-500/20 text-red-400',
}
const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho', SCHEDULED: 'Agendada', RUNNING: 'Enviando',
  PAUSED: 'Pausada', FINISHED: 'Finalizada', CANCELED: 'Cancelada',
}

const ccStatusColors: Record<string, string> = {
  PENDING: 'text-slate-400', SENT: 'text-blue-400', DELIVERED: 'text-cyan-400',
  READ: 'text-green-400', REPLIED: 'text-purple-400', FAILED: 'text-red-400', SKIPPED: 'text-slate-500',
}
const ccStatusLabels: Record<string, string> = {
  PENDING: 'Pendente', SENT: 'Enviado', DELIVERED: 'Entregue',
  READ: 'Lido', REPLIED: 'Respondeu', FAILED: 'Falhou', SKIPPED: 'Ignorado',
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [addFilter, setAddFilter] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${campaignId}`)
    setCampaign(await res.json())
    setLoading(false)
  }, [campaignId])

  useEffect(() => { load() }, [load])

  async function doAction(action: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      toast.success(`Campanha ${action === 'start' ? 'iniciada' : action === 'pause' ? 'pausada' : 'cancelada'}`)
      load()
    }
  }

  async function addContacts() {
    if (!addFilter) return
    setAdding(true)
    const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: { status: addFilter } }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.total} contatos na campanha`)
      load()
    }
    setAdding(false)
  }

  if (loading) return <p className="text-slate-400">Carregando...</p>
  if (!campaign) return <p className="text-slate-400">Campanha não encontrada</p>

  const total = campaign.campaignContacts.length
  const sent = campaign.campaignContacts.filter(c => ['SENT', 'DELIVERED', 'READ', 'REPLIED'].includes(c.status)).length
  const replied = campaign.campaignContacts.filter(c => c.status === 'REPLIED').length
  const failed = campaign.campaignContacts.filter(c => c.status === 'FAILED').length
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-white font-bold">{campaign.name}</h2>
            <Badge className={statusColors[campaign.status]}>{statusLabels[campaign.status] ?? campaign.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <Button onClick={() => doAction('start')} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-1" /> Iniciar
            </Button>
          )}
          {campaign.status === 'RUNNING' && (
            <Button onClick={() => doAction('pause')} className="bg-yellow-600 hover:bg-yellow-700">
              <Pause className="h-4 w-4 mr-1" /> Pausar
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button onClick={() => doAction('start')} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-1" /> Retomar
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total', value: total, color: 'text-white' },
          { icon: CheckCircle, label: 'Enviados', value: sent, color: 'text-green-400' },
          { icon: MessageSquare, label: 'Responderam', value: replied, color: 'text-purple-400' },
          { icon: XCircle, label: 'Falhou', value: failed, color: 'text-red-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {total > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Progresso de envio</span>
              <span className="text-white font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="bg-slate-700 h-2" />
          </CardContent>
        </Card>
      )}

      {/* Message template */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Mensagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans bg-slate-700/50 p-3 rounded-lg">
            {campaign.messageTemplate}
          </pre>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 flex gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Settings2 className="h-4 w-4" />
            <span>Delay: {campaign.minDelay}s — {campaign.maxDelay}s</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="h-4 w-4" />
            <span>Limite diário: {campaign.dailyLimit}</span>
          </div>
        </CardContent>
      </Card>

      {/* Add contacts */}
      {['DRAFT', 'PAUSED'].includes(campaign.status) && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">Adicionar Contatos</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Select value={addFilter} onValueChange={(v) => setAddFilter(v ?? '')}>
              <SelectTrigger className="flex-1 bg-slate-700 border-slate-600 text-slate-300">
                <SelectValue placeholder="Filtrar por status..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="NO_RESPONSE">Sem resposta</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addContacts} disabled={adding || !addFilter} className="bg-purple-600 hover:bg-purple-700">
              {adding ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contacts list */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm">Contatos da Campanha ({total})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800">
            {campaign.campaignContacts.length === 0 ? (
              <p className="text-slate-500 text-sm p-4 text-center">Nenhum contato adicionado ainda</p>
            ) : campaign.campaignContacts.map(cc => (
              <div key={cc.contact.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/30">
                <div>
                  <p className="text-white text-sm font-medium">{cc.contact.fullName}</p>
                  <p className="text-slate-500 text-xs">{cc.contact.phone}</p>
                </div>
                <span className={`text-xs font-medium ${ccStatusColors[cc.status]}`}>
                  {ccStatusLabels[cc.status] ?? cc.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
