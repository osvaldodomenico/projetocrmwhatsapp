'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ExternalLink, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tag {
  id: string
  name: string
  color: string
}

interface ContactDetail {
  id: string
  fullName: string
  phone: string
  church: string | null
  neighborhood: string | null
  city: string | null
  status: string
  temperature: string
  notes: string | null
  tags: { tag: Tag }[]
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
  { value: 'NO_RESPONSE', label: 'Sem resposta' },
  { value: 'CONVERTED', label: 'Convertido' },
  { value: 'LOST', label: 'Perdido' },
  { value: 'DO_NOT_CONTACT', label: 'Não contatar' },
]

const TEMP_OPTIONS = [
  { value: 'COLD', label: 'Frio' },
  { value: 'WARM', label: 'Morno' },
  { value: 'HOT', label: 'Quente' },
]

interface Props {
  contactId: string
}

export function ContactSidebar({ contactId }: Props) {
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [notes, setNotes] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showTagPicker, setShowTagPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`)
      if (!res.ok) return
      const data: ContactDetail = await res.json()
      setContact(data)
      setNotes(data.notes ?? '')
    } catch {
      // ignore
    }
  }, [contactId])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((data: { tags?: Tag[]; data?: Tag[] } | Tag[]) => {
        if (Array.isArray(data)) setAllTags(data)
        else if ('tags' in data && Array.isArray(data.tags)) setAllTags(data.tags)
        else if ('data' in data && Array.isArray(data.data)) setAllTags(data.data)
      })
      .catch(() => {})
  }, [])

  const patch = useCallback(
    async (updates: Record<string, unknown>) => {
      setSaving(true)
      try {
        await fetch(`/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        await fetchContact()
      } catch {
        // ignore
      } finally {
        setSaving(false)
      }
    },
    [contactId, fetchContact],
  )

  const addTag = async (tagId: string) => {
    if (!contact) return
    const currentTagIds = contact.tags.map((ct) => ct.tag.id)
    if (currentTagIds.includes(tagId)) return
    await patch({ tagIds: [...currentTagIds, tagId] })
    setShowTagPicker(false)
  }

  const removeTag = async (tagId: string) => {
    if (!contact) return
    const currentTagIds = contact.tags.map((ct) => ct.tag.id).filter((id) => id !== tagId)
    await patch({ tagIds: currentTagIds })
  }

  if (!contact) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-slate-700 bg-slate-900 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Carregando...</span>
      </div>
    )
  }

  const currentTagIds = contact.tags.map((ct) => ct.tag.id)
  const availableTags = allTags.filter((t) => !currentTagIds.includes(t.id))

  return (
    <div className="w-72 flex-shrink-0 border-l border-slate-700 bg-slate-900 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Detalhes</h3>
          {saving && <span className="text-xs text-slate-500">Salvando...</span>}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 text-xs font-bold">
            {contact.fullName
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{contact.fullName}</div>
            <div className="text-slate-400 text-xs">{contact.phone}</div>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 border-b border-slate-700 space-y-2">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Informações
        </div>
        {contact.church && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Igreja</span>
            <span className="text-slate-300 text-right max-w-[160px] truncate">{contact.church}</span>
          </div>
        )}
        {contact.neighborhood && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Bairro</span>
            <span className="text-slate-300">{contact.neighborhood}</span>
          </div>
        )}
        {contact.city && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Cidade</span>
            <span className="text-slate-300">{contact.city}</span>
          </div>
        )}
      </div>

      {/* Status + Temperature */}
      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Status
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Status do contato</label>
          <select
            value={contact.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Temperatura</label>
          <select
            value={contact.temperature}
            onChange={(e) => patch({ temperature: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5"
          >
            {TEMP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="p-4 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
          Tags
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {contact.tags.map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color + '33', border: `1px solid ${tag.color}55` }}
            >
              <span style={{ color: tag.color }}>{tag.name}</span>
              <button
                onClick={() => removeTag(tag.id)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTagPicker((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-400 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Adicionar tag
          </button>

          {showTagPicker && availableTags.length > 0 && (
            <div className="absolute top-6 left-0 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 min-w-[160px] max-h-48 overflow-y-auto">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {showTagPicker && availableTags.length === 0 && (
            <div className="absolute top-6 left-0 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 text-xs text-slate-500">
              Todas as tags adicionadas
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="p-4 border-b border-slate-700">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
          Anotações
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            if (notes !== (contact.notes ?? '')) {
              patch({ notes })
            }
          }}
          placeholder="Adicionar anotações..."
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-2 resize-none placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Quick actions */}
      <div className="p-4">
        <Link
          href={`/contatos/${contactId}`}
          className={cn(
            'flex items-center gap-2 text-xs text-slate-400 hover:text-purple-400 transition-colors',
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver perfil completo
        </Link>
      </div>
    </div>
  )
}
