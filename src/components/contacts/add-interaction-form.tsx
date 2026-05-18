'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Phone, MapPin, FileText, Send } from 'lucide-react'
import { toast } from 'sonner'

type Props = { contactId: string }

const typeOptions = [
  { value: 'NOTE', label: 'Observação', icon: FileText },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { value: 'CALL', label: 'Ligação', icon: Phone },
  { value: 'VISIT', label: 'Visita', icon: MapPin },
]

export function AddInteractionForm({ contactId }: Props) {
  const [type, setType] = useState('NOTE')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message }),
      })
      if (!res.ok) throw new Error('Erro ao registrar')
      setMessage('')
      toast.success('Interação registrada')
      window.dispatchEvent(new CustomEvent('interaction-added'))
    } catch {
      toast.error('Erro ao registrar interação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={type} onValueChange={(v) => setType(v || 'NOTE')}>
            <SelectTrigger className="w-44 bg-slate-700 border-slate-600 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              {typeOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Registrar interação, observação ou mensagem enviada..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !message.trim()} size="sm"
              className="bg-purple-600 hover:bg-purple-700">
              <Send className="h-3 w-3 mr-2" />
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
