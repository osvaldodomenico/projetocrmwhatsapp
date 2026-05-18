'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Phone, MapPin, FileText, Settings, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Interaction = {
  id: string
  type: string
  message: string
  createdAt: string
  user: { name: string | null; email: string } | null
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  NOTE: { icon: FileText, label: 'Observação', color: 'text-slate-400 bg-slate-400/10' },
  WHATSAPP: { icon: MessageSquare, label: 'WhatsApp', color: 'text-green-400 bg-green-400/10' },
  CALL: { icon: Phone, label: 'Ligação', color: 'text-blue-400 bg-blue-400/10' },
  VISIT: { icon: MapPin, label: 'Visita', color: 'text-purple-400 bg-purple-400/10' },
  SYSTEM: { icon: Settings, label: 'Sistema', color: 'text-slate-500 bg-slate-500/10' },
}

export function InteractionTimeline({ contactId }: { contactId: string }) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`)
      const data = await res.json()
      setInteractions(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('interaction-added', handler)
    return () => window.removeEventListener('interaction-added', handler)
  }, [contactId])

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" /> Timeline de Relacionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-8">Carregando...</p>
        ) : interactions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            Nenhuma interação registrada ainda. Use o formulário acima para registrar.
          </p>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction, idx) => {
              const config = typeConfig[interaction.type] ?? typeConfig.NOTE
              const Icon = config.icon
              const userName = interaction.user?.name ?? interaction.user?.email ?? 'Sistema'
              const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <div key={interaction.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-1.5 rounded-full ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {idx < interactions.length - 1 && (
                      <div className="w-px flex-1 bg-slate-700 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-slate-400">{config.label}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(interaction.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                      {interaction.user && (
                        <>
                          <span className="text-xs text-slate-600">•</span>
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="bg-purple-600 text-white text-[8px]">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-500">{userName}</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{interaction.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
