'use client'
import { useEffect, useState } from 'react'
import { Cake, Snowflake, UserPlus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function AlertsWidget() {
  const [alerts, setAlerts] = useState<any>(null)

  useEffect(() => {
    fetch('/api/cron/alerts').then(r => r.json()).then(setAlerts)
  }, [])

  if (!alerts) return null

  const sections = [
    {
      key: 'birthdays',
      label: 'Aniversariantes',
      icon: Cake,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      items: alerts.birthdays ?? [],
      renderItem: (c: any) => `${c.fullName} — ${c.normalizedPhone}`
    },
    {
      key: 'coldLeads',
      label: 'Leads sem contato há 30+ dias',
      icon: Snowflake,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      items: alerts.coldLeads ?? [],
      renderItem: (c: any) => `${c.fullName} — ${c.temperature}`
    },
    {
      key: 'newNoContact',
      label: 'Novos sem contato esta semana',
      icon: UserPlus,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      items: alerts.newNoContact ?? [],
      renderItem: (c: any) => c.fullName
    },
  ].filter(s => s.items.length > 0)

  if (sections.length === 0) return null

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
      <h3 className="text-white font-medium mb-4">Alertas</h3>
      <div className="space-y-4">
        {sections.map(({ key, label, icon: Icon, color, bg, items, renderItem }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded ${bg} flex items-center justify-center`}>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </div>
              <span className="text-slate-300 text-sm font-medium">{label}</span>
              <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-1.5">{items.length}</span>
            </div>
            <div className="space-y-1 pl-8">
              {items.slice(0, 3).map((item: any) => (
                <Link key={item.id} href={`/contatos?id=${item.id}`} className="flex items-center justify-between group">
                  <span className="text-slate-400 text-xs group-hover:text-white transition-colors">{renderItem(item)}</span>
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-400" />
                </Link>
              ))}
              {items.length > 3 && (
                <p className="text-slate-500 text-xs">+{items.length - 3} mais</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
