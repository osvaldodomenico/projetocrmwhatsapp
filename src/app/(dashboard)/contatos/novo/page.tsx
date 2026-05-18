'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const data: Record<string, any> = {}
    fd.forEach((v, k) => { if (String(v).trim()) data[k] = String(v).trim() })

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success('Contato criado!')
      router.push('/contatos')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao criar contato')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Novo Contato" />
      <div className="p-6 max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Cadastrar Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Primeiro Nome *</Label>
                  <Input name="firstName" required className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Sobrenome</Label>
                  <Input name="lastName" className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefone (WhatsApp) *</Label>
                <Input name="phone" required placeholder="(11) 99999-9999" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Igreja</Label>
                  <Input name="church" className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Grupo</Label>
                  <Input name="groupName" className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Bairro</Label>
                  <Input name="neighborhood" className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Cidade</Label>
                  <Input name="city" className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Observações</Label>
                <Textarea name="notes" rows={3} className="bg-slate-700 border-slate-600 text-white resize-none" />
              </div>
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Contato'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
