import { notFound } from 'next/navigation'
import { contactService } from '@/services/contact.service'
import { Header } from '@/components/shared/header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InteractionTimeline } from '@/components/contacts/interaction-timeline'
import { AddInteractionForm } from '@/components/contacts/add-interaction-form'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, MapPin, Church, Users, Calendar, Star, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

const tempColors: Record<string, string> = {
  HOT: 'bg-red-500/20 text-red-400',
  WARM: 'bg-yellow-500/20 text-yellow-400',
  COLD: 'bg-blue-500/20 text-blue-400',
}
const tempLabels: Record<string, string> = { HOT: '🔥 Quente', WARM: '🌡️ Morno', COLD: '❄️ Frio' }

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  FOLLOW_UP: 'bg-yellow-500/20 text-yellow-400',
  NO_RESPONSE: 'bg-orange-500/20 text-orange-400',
  INVALID_NUMBER: 'bg-red-500/20 text-red-400',
  DO_NOT_CONTACT: 'bg-red-700/20 text-red-600',
  CONVERTED: 'bg-blue-500/20 text-blue-400',
  LOST: 'bg-slate-600/20 text-slate-500',
}
const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', FOLLOW_UP: 'Follow-up',
  NO_RESPONSE: 'Sem resposta', INVALID_NUMBER: 'Nº inválido',
  DO_NOT_CONTACT: 'Não contatar', CONVERTED: 'Convertido', LOST: 'Perdido',
}

export default async function ContactProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let contact: any
  try {
    contact = await contactService.getById(id)
  } catch {
    notFound()
  }

  const initials = contact.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Perfil do Contato" />
      <div className="p-6">
        <Link href="/contatos" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 w-fit">
          <ArrowLeft className="h-4 w-4" /> Voltar para Contatos
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Contact Info */}
          <div className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarFallback className="bg-purple-600 text-white text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-white font-bold text-lg">{contact.fullName}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap justify-center">
                    <Badge className={statusColors[contact.status]}>{statusLabels[contact.status]}</Badge>
                    <Badge className={tempColors[contact.temperature]}>{tempLabels[contact.temperature]}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-sm font-semibold">{contact.score} pts</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                  {contact.church && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Church className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>{contact.church}</span>
                    </div>
                  )}
                  {contact.groupName && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>{contact.groupName}</span>
                    </div>
                  )}
                  {contact.neighborhood && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>{contact.neighborhood}{contact.city ? `, ${contact.city}` : ''}</span>
                    </div>
                  )}
                  {contact.birthDate && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      <span>{format(new Date(contact.birthDate), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {contact.tags.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Tags</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {contact.tags.map(({ tag }: any) => (
                    <span key={tag.id} className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: tag.color + '33', color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}

            {contact.notes && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Observações</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{contact.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Cadastrado em</span>
                  <span>{format(new Date(contact.createdAt), 'dd/MM/yyyy')}</span>
                </div>
                {contact.lastContactAt && (
                  <div className="flex justify-between">
                    <span>Último contato</span>
                    <span>{format(new Date(contact.lastContactAt), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Origem</span>
                  <span>{contact.source ?? 'manual'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <AddInteractionForm contactId={contact.id} />
            <InteractionTimeline contactId={contact.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
