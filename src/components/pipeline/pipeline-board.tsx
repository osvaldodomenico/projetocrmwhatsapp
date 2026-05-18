'use client'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { Phone, Star, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STAGES = [
  { key: 'NOVO', label: 'Novo', color: 'border-slate-500', header: 'bg-slate-700' },
  { key: 'QUALIFICANDO', label: 'Qualificando', color: 'border-blue-500', header: 'bg-blue-900/50' },
  { key: 'PROPOSTA', label: 'Proposta', color: 'border-yellow-500', header: 'bg-yellow-900/50' },
  { key: 'FECHADO', label: 'Fechado', color: 'border-green-500', header: 'bg-green-900/50' },
  { key: 'PERDIDO', label: 'Perdido', color: 'border-red-500', header: 'bg-red-900/50' },
]

const TEMP_ICON: Record<string, string> = { HOT: '🔴', WARM: '🟡', COLD: '🔵' }

type Contact = {
  id: string; fullName: string; normalizedPhone: string; leadStage: string
  temperature: string; score: number; church: string | null; lastContactAt: string | null
  tags: { tag: { name: string; color: string } }[]
}

type Grouped = Record<string, Contact[]>

export function PipelineBoard() {
  const [grouped, setGrouped] = useState<Grouped>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/pipeline')
    const data = await res.json()
    setGrouped(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const { draggableId, source, destination } = result
    if (source.droppableId === destination.droppableId) return

    const newGrouped = { ...grouped }
    const contact = newGrouped[source.droppableId].find(c => c.id === draggableId)!
    newGrouped[source.droppableId] = newGrouped[source.droppableId].filter(c => c.id !== draggableId)
    newGrouped[destination.droppableId] = [
      { ...contact, leadStage: destination.droppableId },
      ...newGrouped[destination.droppableId]
    ]
    setGrouped(newGrouped)

    try {
      await fetch(`/api/pipeline/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStage: destination.droppableId })
      })
    } catch {
      toast.error('Erro ao mover contato')
      load()
    }
  }

  const totalByStage = (key: string) => grouped[key]?.length ?? 0

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Pipeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">Gerencie seus leads por etapa</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-slate-600 text-slate-300">
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Carregando...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto flex-1 pb-4">
            {STAGES.map(stage => (
              <div key={stage.key} className={`flex-shrink-0 w-72 flex flex-col rounded-xl border ${stage.color} bg-slate-800/50`}>
                <div className={`${stage.header} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                  <span className="text-white font-semibold text-sm">{stage.label}</span>
                  <span className="bg-slate-700/60 text-slate-300 text-xs rounded-full px-2 py-0.5">{totalByStage(stage.key)}</span>
                </div>
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 space-y-2 min-h-32 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''}`}
                    >
                      {(grouped[stage.key] ?? []).map((contact, index) => (
                        <Draggable key={contact.id} draggableId={contact.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-slate-700/80 rounded-lg p-3 border border-slate-600 cursor-grab active:cursor-grabbing transition-shadow ${snapshot.isDragging ? 'shadow-2xl ring-1 ring-purple-500' : 'hover:bg-slate-700'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-white text-sm font-medium leading-tight">{contact.fullName}</p>
                                <span className="text-lg flex-shrink-0">{TEMP_ICON[contact.temperature] ?? '🔵'}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1.5 text-slate-400 text-xs">
                                <Phone className="h-3 w-3" />
                                <span>{contact.normalizedPhone}</span>
                              </div>
                              {contact.church && (
                                <p className="text-slate-500 text-xs mt-1 truncate">{contact.church}</p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-1 flex-wrap">
                                  {contact.tags.slice(0, 2).map(({ tag }) => (
                                    <span key={tag.name} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: tag.color + '33', color: tag.color, border: `1px solid ${tag.color}55` }}>{tag.name}</span>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 text-xs">
                                  <Star className="h-3 w-3 fill-yellow-400" />
                                  <span>{contact.score}</span>
                                </div>
                              </div>
                              {contact.lastContactAt && (
                                <p className="text-slate-500 text-xs mt-1.5">
                                  Último: {format(new Date(contact.lastContactAt), "dd/MM", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
