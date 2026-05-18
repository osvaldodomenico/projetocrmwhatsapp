import { ConversationsList } from '@/components/conversations/conversations-list'
import { ChatWindow } from '@/components/conversations/chat-window'
import { ContactSidebar } from '@/components/conversations/contact-sidebar'
import { MessageSquare } from 'lucide-react'

interface Props {
  searchParams: Promise<{ contact?: string }>
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 gap-4">
      <div className="p-4 rounded-full bg-slate-800/50 border border-slate-700">
        <MessageSquare className="h-10 w-10 text-slate-600" />
      </div>
      <div className="text-center">
        <h3 className="text-slate-400 font-medium">Nenhuma conversa selecionada</h3>
        <p className="text-slate-600 text-sm mt-1">
          Selecione uma conversa à esquerda para começar
        </p>
      </div>
    </div>
  )
}

export default async function ConversasPage({ searchParams }: Props) {
  const { contact: contactId } = await searchParams

  return (
    <div className="flex flex-1 bg-slate-950 h-screen overflow-hidden">
      <ConversationsList activeContactId={contactId} />

      {contactId ? (
        <>
          <ChatWindow contactId={contactId} />
          <ContactSidebar contactId={contactId} />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
