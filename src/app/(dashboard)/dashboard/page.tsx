'use client'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, Flame, TrendingUp, CalendarCheck, Megaphone, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STAGE_LABELS: Record<string, string> = {
  NOVO: 'Novo', QUALIFICANDO: 'Qualificando', PROPOSTA: 'Proposta',
  FECHADO: 'Fechado', PERDIDO: 'Perdido'
}
const STAGE_COLORS: Record<string, string> = {
  NOVO: '#64748b', QUALIFICANDO: '#3b82f6', PROPOSTA: '#eab308',
  FECHADO: '#22c55e', PERDIDO: '#ef4444'
}
const TEMP_COLORS = ['#ef4444', '#f59e0b', '#64748b']

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) return (
    <div className="p-6 flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  )

  const tempData = [
    { name: 'HOT', value: stats.temperature.hot },
    { name: 'WARM', value: stats.temperature.warm },
    { name: 'COLD', value: stats.temperature.cold },
  ]

  const statCards = [
    { label: 'Total de Contatos', value: stats.totalContacts, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Novos esta semana', value: stats.newThisWeek, icon: ArrowUpRight, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Leads Quentes', value: stats.temperature.hot, icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Follow-ups Hoje', value: stats.followUpsToday, icon: CalendarCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Campanhas Ativas', value: stats.campaignsRunning, icon: Megaphone, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Visao geral do CRM</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Temperature Pie */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Temperatura dos Leads</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tempData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {tempData.map((_, i) => <Cell key={i} fill={TEMP_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tempData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TEMP_COLORS[i] }} />
                <span className="text-slate-300 text-xs">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Bar */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Leads por Etapa</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.byStage.map((s: any) => ({ ...s, label: STAGE_LABELS[s.stage] ?? s.stage }))}>
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.byStage.map((s: any, i: number) => (
                  <Cell key={i} fill={STAGE_COLORS[s.stage] ?? '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Line */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Crescimento (30 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.growthChart}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(d: string) => format(new Date(d + 'T00:00:00'), 'dd/MM', { locale: ptBR })}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#fff' }}
                labelFormatter={(d) => format(new Date(String(d) + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
              />
              <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent imports */}
      {stats.recentImports?.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-white font-medium mb-3">Importacoes Recentes</h3>
          <div className="space-y-2">
            {stats.recentImports.map((imp: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <span className="text-slate-300 text-sm">{imp.fileName}</span>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="text-green-400">{imp.imported} importados</span>
                  <span>{format(new Date(imp.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
