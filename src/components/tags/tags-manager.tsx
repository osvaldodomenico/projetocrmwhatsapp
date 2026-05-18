'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

type Tag = { id: string; name: string; color: string; _count: { contacts: number } }

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#22c55e', '#06b6d4', '#3b82f6', '#d97706', '#dc2626',
]

export function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/tags')
    setTags(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setName('')
    setColor('#6366f1')
    setDialogOpen(true)
  }

  function openEdit(tag: Tag) {
    setEditing(tag)
    setName(tag.name)
    setColor(tag.color)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const url = editing ? `/api/tags/${editing.id}` : '/api/tags'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Erro ao salvar')
        return
      }
      toast.success(editing ? 'Tag atualizada' : 'Tag criada')
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tag: Tag) {
    if (!confirm(`Remover tag "${tag.name}"? Será desassociada de ${tag._count.contacts} contatos.`)) return
    await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
    toast.success('Tag removida')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{tags.length} tags cadastradas</p>
        <Button onClick={openCreate} size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-1" /> Nova Tag
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map(tag => (
            <Card key={tag.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <div>
                    <Badge className="text-sm font-medium" style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}44` }}>
                      {tag.name}
                    </Badge>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-500 text-xs">{tag._count.contacts} contatos</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(tag)} className="text-slate-400 hover:text-white h-7 w-7 p-0">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tag)} className="text-slate-400 hover:text-red-400 h-7 w-7 p-0">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da tag"
                className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid white` : 'none', outlineOffset: '2px' }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0" />
              </div>
              <div className="mt-2">
                <Badge style={{ backgroundColor: color + '33', color, border: `1px solid ${color}44` }}>
                  {name || 'preview'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600 text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-purple-600 hover:bg-purple-700">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
