'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserFormDialog } from './user-form-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type User = { id: string; name: string | null; email: string; image: string | null; role: string; createdAt: string }

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(user: User) {
    if (!confirm(`Excluir ${user.name ?? user.email}?`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Usuário excluído'); load() }
    else toast.error('Erro ao excluir')
  }

  const initials = (name: string | null, email: string) =>
    (name ?? email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Usuários</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Usuário</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">E-mail</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Perfil</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Cadastrado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center text-slate-400 py-12">Carregando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-slate-400 py-12">Nenhum usuário encontrado</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {user.image && <AvatarImage src={user.image} />}
                      <AvatarFallback className="bg-purple-600 text-white text-xs">
                        {initials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm font-medium">{user.name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-600/20 text-purple-300 border-purple-600/30'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Agente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                      onClick={() => { setEditing(user); setDialogOpen(true) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-slate-400 hover:text-red-400"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); load() }}
        user={editing}
      />
    </div>
  )
}
