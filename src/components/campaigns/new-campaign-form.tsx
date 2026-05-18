'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, MessageSquare, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

export function NewCampaignForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState('Olá {{first_name}}, tudo bem?')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const data: any = {
      name: fd.get('name'),
      description: fd.get('description') || undefined,
      messageTemplate: template,
      minDelay: Number(fd.get('minDelay') ?? 20),
      maxDelay: Number(fd.get('maxDelay') ?? 90),
      dailyLimit: Number(fd.get('dailyLimit') ?? 200),
    }

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const campaign = await res.json()
      toast.success('Campanha criada!')
      router.push(`/campanhas/${campaign.id}`)
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao criar campanha')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.back()} className="text-slate-400">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Informações da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome da Campanha *</Label>
              <Input name="name" required placeholder="Ex: Convite Culto Domingo" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Descrição</Label>
              <Input name="description" placeholder="Descrição opcional" className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={template}
              onChange={e => setTemplate(e.target.value)}
              rows={6}
              placeholder="Olá {{first_name}}, ..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none font-mono text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              {['{{first_name}}', '{{full_name}}', '{{church}}', '{{neighborhood}}'].map(v => (
                <button key={v} type="button" onClick={() => setTemplate(t => t + v)}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-purple-400 rounded border border-slate-600 transition-colors">
                  {v}
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-xs">Use variáveis dinâmicas para personalizar a mensagem.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Configurações Anti-ban
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Delay mínimo (seg)</Label>
              <Input name="minDelay" type="number" defaultValue={20} min={5} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Delay máximo (seg)</Label>
              <Input name="maxDelay" type="number" defaultValue={90} min={10} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Limite diário</Label>
              <Input name="dailyLimit" type="number" defaultValue={200} min={1} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading || !template.trim()} className="bg-purple-600 hover:bg-purple-700 w-full">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Criando...' : 'Criar Campanha e Adicionar Contatos'}
        </Button>
      </form>
    </div>
  )
}
