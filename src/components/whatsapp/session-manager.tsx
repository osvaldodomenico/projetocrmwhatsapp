'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, RefreshCw, Plus, Wifi } from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppSession {
  id: string
  name: string
  status: string
  qrCode: string | null
  phone: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  CONNECTED: { label: 'Conectado', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  DISCONNECTED: { label: 'Desconectado', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  QR_CODE: { label: 'Aguardando QR', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  CONNECTING: { label: 'Conectando', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ERROR: { label: 'Erro', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

export function SessionManager() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/sessions')
      if (res.ok) setSessions(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Auto-refresh every 10s if any session is awaiting QR / connecting
  useEffect(() => {
    const hasQr = sessions.some((s) => s.status === 'QR_CODE' || s.status === 'CONNECTING')
    if (!hasQr) return

    const interval = setInterval(() => {
      sessions
        .filter((s) => s.status === 'QR_CODE' || s.status === 'CONNECTING')
        .forEach(async (s) => {
          try {
            const res = await fetch(`/api/whatsapp/sessions/${s.id}/status`)
            if (res.ok) {
              const data = await res.json()
              setSessions((prev) =>
                prev.map((p) =>
                  p.id === s.id ? { ...p, status: data.status, phone: data.phone } : p
                )
              )
              if (data.status === 'CONNECTED') {
                toast.success(`Instância ${s.name} conectada!`)
                setQrOpen(false)
              }
            }
          } catch {
            // silent
          }
        })
    }, 10000)

    return () => clearInterval(interval)
  }, [sessions])

  const handleCreate = async () => {
    if (!instanceName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/whatsapp/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName: instanceName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Erro ao criar instância')
        return
      }
      const session = await res.json()
      setSessions((prev) => [session, ...prev])
      setCreateOpen(false)
      setInstanceName('')
      toast.success('Instância criada com sucesso')
    } catch {
      toast.error('Erro ao criar instância')
    } finally {
      setCreating(false)
    }
  }

  const handleConnect = async (session: WhatsAppSession) => {
    setConnecting(session.id)
    try {
      const res = await fetch(`/api/whatsapp/sessions/${session.id}/connect`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Erro ao conectar')
        return
      }
      const updated: WhatsAppSession = await res.json()
      setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, ...updated } : s)))
      setSelectedSession(updated)
      setQrOpen(true)
    } catch {
      toast.error('Erro ao conectar')
    } finally {
      setConnecting(null)
    }
  }

  const handleRefreshStatus = async (session: WhatsAppSession) => {
    setRefreshing(session.id)
    try {
      const res = await fetch(`/api/whatsapp/sessions/${session.id}/status`)
      if (res.ok) {
        const data = await res.json()
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id ? { ...s, status: data.status, phone: data.phone } : s
          )
        )
        toast.success('Status atualizado')
      }
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setRefreshing(null)
    }
  }

  const handleDelete = async (session: WhatsAppSession) => {
    if (!confirm(`Excluir instância "${session.name}"?`)) return
    setDeleting(session.id)
    try {
      const res = await fetch(`/api/whatsapp/sessions/${session.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== session.id))
        toast.success('Instância excluída')
      } else {
        toast.error('Erro ao excluir instância')
      }
    } catch {
      toast.error('Erro ao excluir instância')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Instâncias WhatsApp</h3>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie suas conexões via Evolution API</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Instância
        </Button>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-slate-400 text-sm">Carregando...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400 text-sm">
            Nenhuma instância configurada. Clique em &quot;Nova Instância&quot; para começar.
          </div>
        ) : (
          sessions.map((s) => {
            const cfg = statusConfig[s.status] ?? statusConfig.DISCONNECTED
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Wifi className="h-5 w-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">{s.name}</p>
                    {s.phone && (
                      <p className="text-slate-400 text-xs mt-0.5">{s.phone}</p>
                    )}
                  </div>
                  <Badge className={`text-xs border ${cfg.className}`}>{cfg.label}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 text-xs"
                    disabled={refreshing === s.id}
                    onClick={() => handleRefreshStatus(s)}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${refreshing === s.id ? 'animate-spin' : ''}`} />
                    Status
                  </Button>

                  {s.status !== 'CONNECTED' && (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                      disabled={connecting === s.id}
                      onClick={() => handleConnect(s)}
                    >
                      {connecting === s.id ? 'Conectando...' : 'Conectar'}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300 text-xs"
                    disabled={deleting === s.id}
                    onClick={() => handleDelete(s)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create instance modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Instância WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Nome da instância</label>
              <Input
                placeholder="ex: minha-empresa"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={creating || !instanceName.trim()}
                onClick={handleCreate}
              >
                {creating ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code modal */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Conectar: {selectedSession?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedSession?.qrCode ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedSession.qrCode}
                  alt="QR Code WhatsApp"
                  className="rounded-lg w-64 h-64 object-contain bg-white p-2"
                />
                <p className="text-slate-400 text-sm text-center">
                  Abra o WhatsApp no celular e escaneie o QR Code acima.
                  <br />
                  O status será atualizado automaticamente.
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">QR Code não disponível. Tente novamente.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
