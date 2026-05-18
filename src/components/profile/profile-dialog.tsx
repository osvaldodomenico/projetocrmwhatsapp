'use client'
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Save, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

type Props = { open: boolean; onClose: () => void }

export function ProfileDialog({ open, onClose }: Props) {
  const { update: updateSession } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setName(data.name ?? '')
        setEmail(data.email ?? '')
        setImage(data.image ?? null)
      })
  }, [open])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await updateSession({ name, image })
      toast.success('Perfil atualizado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) { toast.error('Preencha todos os campos'); return }
    if (newPassword !== confirmPassword) { toast.error('As senhas não conferem'); return }
    if (newPassword.length < 6) { toast.error('Senha deve ter mínimo 6 caracteres'); return }

    setChangingPwd(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Senha alterada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar senha')
    } finally {
      setChangingPwd(false)
    }
  }

  const initials = (name || email).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              <Avatar className="h-20 w-20">
                {image && <AvatarImage src={image} className="object-cover" />}
                <AvatarFallback className="bg-purple-600 text-white text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-xs">Clique para trocar a foto</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-slate-300">Nome</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">E-mail</Label>
            <Input
              value={email}
              disabled
              className="bg-slate-700/50 border-slate-600 text-slate-400"
            />
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>

          {/* Divider */}
          <div className="border-t border-slate-700" />

          {/* Password */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Alterar Senha
            </p>
            <Input
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Senha atual"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              type="password"
              placeholder="Nova senha"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirmar nova senha"
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleChangePassword}
              disabled={changingPwd}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {changingPwd ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
