'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type User = { id: string; name: string | null; email: string; role: string }
type Props = { open: boolean; onClose: () => void; onSuccess: () => void; user: User | null }

export function UserFormDialog({ open, onClose, onSuccess, user }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('agent')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setEmail(user.email)
      setRole(user.role)
      setPassword('')
    } else {
      setName('')
      setEmail('')
      setRole('agent')
      setPassword('')
    }
  }, [user, open])

  async function handleSubmit() {
    if (!name || !email) { toast.error('Nome e e-mail são obrigatórios'); return }
    if (!user && !password) { toast.error('Senha obrigatória para novo usuário'); return }

    setLoading(true)
    try {
      const body: Record<string, string> = { name, email, role }
      if (password) body.password = password

      const res = await fetch(user ? `/api/users/${user.id}` : '/api/users', {
        method: user ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      toast.success(user ? 'Usuário atualizado' : 'Usuário criado')
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-slate-300">Nome</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome completo"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">E-mail</Label>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              placeholder="email@exemplo.com"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Perfil</Label>
            <Select value={role} onValueChange={(v) => setRole(v ?? 'agent')}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">{user ? 'Nova Senha (opcional)' : 'Senha'}</Label>
            <Input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder={user ? 'Deixe em branco para não alterar' : 'Mínimo 6 caracteres'}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {loading ? 'Salvando...' : user ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
