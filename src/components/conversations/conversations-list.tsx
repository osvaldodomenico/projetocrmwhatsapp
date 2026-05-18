'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface ConversationItem {
  contact: {
    id: string
    fullName: string
    phone: string
    normalizedPhone: string
    temperature: string
    status: string
    tags: { id: string; name: string; color: string }[]
  }
  lastMessage: {
    id: string
    body: string | null
    direction: string
    createdAt: string
  } | null
  unreadCount: number
}

function temperatureColor(temp: string): string {
  switch (temp) {
    case 'HOT':
      return 'bg-red-500'
    case 'WARM':
      return 'bg-orange-400'
    default:
      return 'bg-slate-500'
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 60) return `${diffMin}min`

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) return 'ontem'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

interface Props {
  activeContactId?: string
}

export function ConversationsList({ activeContactId }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) return
      const data = await res.json()
      setConversations(data)
    } catch {
      // ignore network errors during polling
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  return (
    <div className="w-80 flex-shrink-0 border-r border-slate-700 flex flex-col bg-slate-900 h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-400" />
        <h2 className="text-white font-semibold text-sm">Conversas</h2>
        {conversations.length > 0 && (
          <span className="ml-auto text-xs text-slate-500">{conversations.length}</span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
            Carregando...
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm gap-2">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <span>Nenhuma conversa</span>
          </div>
        )}

        {conversations.map((conv) => {
          const isActive = conv.contact.id === activeContactId
          const preview = conv.lastMessage?.body
            ? conv.lastMessage.body.slice(0, 40) + (conv.lastMessage.body.length > 40 ? '…' : '')
            : '(sem mensagem)'
          const time = conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : ''

          return (
            <Link
              key={conv.contact.id}
              href={`/conversas?contact=${conv.contact.id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/60 transition-colors cursor-pointer',
                isActive && 'bg-purple-600/10 border-l-2 border-l-purple-500',
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                  temperatureColor(conv.contact.temperature),
                )}
              >
                {getInitials(conv.contact.fullName)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-white text-sm font-medium truncate">
                    {conv.contact.fullName}
                  </span>
                  <span className="text-slate-500 text-xs flex-shrink-0">{time}</span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-slate-400 text-xs truncate">{preview}</span>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
