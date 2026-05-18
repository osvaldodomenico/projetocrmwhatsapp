'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'saudacao', label: 'Saudação', color: 'bg-blue-600/20 text-blue-300 border-blue-600/30' },
  { value: 'followup', label: 'Follow-up', color: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30' },
  { value: 'aniversario', label: 'Aniversário', color: 'bg-pink-600/20 text-pink-300 border-pink-600/30' },
  { value: 'campanha', label: 'Campanha', color: 'bg-purple-600/20 text-purple-300 border-purple-600/30' },
  { value: 'outro', label: 'Outro', color: 'bg-slate-600/20 text-slate-300 border-slate-600/30' },
]

type Template = { id: string; name: string; content: string; category: string | null; createdAt: string }

export function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', content: '', category: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/templates')
    setTemplates(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ name: '', content: '', category: '' }); setDialogOpen(true) }
  function openEdit(t: Template) { setEditing(t); setForm({ name: t.name, content: t.content, category: t.category ?? '' }); setDialogOpen(true) }

  async function handleSave() {
    if (!form.name || !form.content) { toast.error('Nome e conteúdo são obrigatórios'); return }
    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/templates/${editing.id}` : '/api/templates', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? 'Template atualizado' : 'Template criado')
      setDialogOpen(false); load()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(t: Template) {
    if (!confirm(`Excluir "${t.name}"?`)) return
    await fetch(`/api/templates/${t.id}`, { method: 'DELETE' })
    toast.success('Template excluído'); load()
  }

  const catInfo = (cat: string | null) => CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[4]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Templates de Mensagem</h1>
          <p className="text-slate-400 text-sm mt-0.5">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openNew} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-16">Carregando...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <FileText className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-slate-400">Nenhum template criado ainda</p>
          <Button onClick={openNew} variant="outline" className="border-slate-600 text-slate-300">Criar primeiro template</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const cat = catInfo(t.category)
            return (
              <div key={t.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.color}`}>{cat.label}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-white font-medium text-sm">{t.name}</p>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{t.content}</p>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Template' : 'Novo Template'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Saudação inicial" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v ?? '' }))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-200"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Conteúdo</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Olá {{nome}}, tudo bem?" className="bg-slate-700 border-slate-600 text-white resize-none font-mono text-sm" />
              <p className="text-slate-500 text-xs">Use {'{{nome}}'} e {'{{telefone}}'} como variáveis</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600 text-slate-300">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
