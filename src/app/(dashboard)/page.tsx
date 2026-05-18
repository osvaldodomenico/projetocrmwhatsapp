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
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', FOLLOW_UP: 'Follow-up',
  NO_RESPONSE: 'Sem resposta', INVALID_NUMBER: 'Nr inválido',
  DO_NOT_CONTACT: 'Não contatar', CONVERTED: 'Convertido', LOST: 'Perdido',
}

export default async function DashboardPage() {
  let stats
  try {
    stats = await contactService.getDashboardStats()
  } catch {
    stats = {
      totalContacts: 0, activeContacts: 0, coldContacts: 0, hotContacts: 0,
      warmContacts: 0, noResponseContacts: 0, pendingFollowUps: 0,
      todayInteractions: 0, campaignsSent: 0,
      contactsByChurch: [], contactsByNeighborhood: [], contactsByStatus: [],
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total de Contatos" value={stats.totalContacts} icon={Users} />
          <StatsCard title="Ativos" value={stats.activeContacts} icon={UserCheck} />
          <StatsCard title="Quentes" value={stats.hotContacts} icon={Flame} variant="hot" />
          <StatsCard title="Frios" value={stats.coldContacts} icon={Snowflake} variant="cold" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Mornos" value={stats.warmContacts} icon={TrendingUp} variant="warm" />
          <StatsCard title="Sem resposta" value={stats.noResponseContacts} icon={AlertTriangle} variant="danger" />
          <StatsCard title="Follow-ups pendentes" value={stats.pendingFollowUps} icon={Calendar} />
          <StatsCard title="Atendimentos hoje" value={stats.todayInteractions} icon={MessageSquare} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByStatus.length === 0 && <p className="text-slate-500 text-sm">Sem dados</p>}
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

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Igreja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByChurch.length === 0 && <p className="text-slate-500 text-sm">Sem dados</p>}
              {stats.contactsByChurch.slice(0, 8).map(({ church, count }) => (
                <div key={church} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate">{church}</span>
                  <span className="text-white font-semibold text-sm ml-2">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Por Bairro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.contactsByNeighborhood.length === 0 && <p className="text-slate-500 text-sm">Sem dados</p>}
              {stats.contactsByNeighborhood.slice(0, 8).map(({ neighborhood, count }) => (
                <div key={neighborhood} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate">{neighborhood}</span>
                  <span className="text-white font-semibold text-sm ml-2">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
