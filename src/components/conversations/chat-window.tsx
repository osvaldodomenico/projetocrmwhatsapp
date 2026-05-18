'use client'

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  body: string | null
  direction: string
  createdAt: string
  readAt: string | null
}

interface Contact {
  id: string
  fullName: string
  phone: string
  normalizedPhone: string
  status: string
  temperature: string
}

interface Session {
  id: string
  name: string
  status: string
  phone: string | null
}

function formatMsgTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: undefined,
  })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

interface Props {
  contactId: string
}

export function ChatWindow({ contactId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isAtBottomRef = useRef(true)

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const res = await fetch(`/api/conversations/${contactId}/messages?limit=200`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
      if (initial) setContact(data.contact ?? null)
      if (initial) setLoading(false)
    } catch {
      if (initial) setLoading(false)
    }
  }, [contactId])

  // Fetch sessions
  useEffect(() => {
    fetch('/api/whatsapp/sessions')
      .then((r) => r.json())
      .then((data: Session[]) => {
        setSessions(data)
        if (data.length > 0) setSelectedSessionId(data[0].id)
      })
      .catch(() => {})
  }, [])

  // Initial load + mark as read
  useEffect(() => {
    setLoading(true)
    setMessages([])
    setContact(null)
    fetchMessages(true).then(() => {
      fetch(`/api/conversations/${contactId}/read`, { method: 'POST' }).catch(() => {})
    })
  }, [contactId, fetchMessages])

  // Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      const scrollEl = scrollRef.current
      if (scrollEl) {
        const { scrollTop, scrollHeight, clientHeight } = scrollEl
        isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60
      }
      await fetchMessages()
      if (isAtBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
    }
  }, [loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }, [input])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedSessionId || sending) return

    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/conversations/${contactId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: selectedSessionId }),
      })
      if (res.ok) {
        await fetchMessages()
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-900 flex items-center gap-3 flex-shrink-0">
        {contact ? (
          <>
            <div className="w-9 h-9 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 text-xs font-bold">
              {contact.fullName
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{contact.fullName}</div>
              <div className="text-slate-400 text-xs">{contact.phone}</div>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-sm">Carregando...</div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {loading && (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {!loading &&
          messages.map((msg, idx) => {
            const isOutbound = msg.direction === 'OUTBOUND'
            const prevMsg = messages[idx - 1]
            const showDateSep =
              !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt)

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className="flex items-center justify-center my-4">
                    <span className="text-xs text-slate-500 bg-slate-800/80 px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    'flex',
                    isOutbound ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-xl px-3 py-2 text-sm',
                      isOutbound
                        ? 'bg-purple-600/20 border border-purple-600/30 text-slate-100'
                        : 'bg-slate-700/50 text-slate-100',
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.body ?? ''}</div>
                    <div
                      className={cn(
                        'text-[10px] mt-1',
                        isOutbound ? 'text-purple-300/70 text-right' : 'text-slate-500',
                      )}
                    >
                      {formatMsgTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-700 bg-slate-900 p-3 flex-shrink-0">
        {sessions.length > 1 && (
          <div className="mb-2">
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1 w-full"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''} — {s.status}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm resize-none placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            style={{ minHeight: '38px', maxHeight: '96px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedSessionId || sending}
            className="flex-shrink-0 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
