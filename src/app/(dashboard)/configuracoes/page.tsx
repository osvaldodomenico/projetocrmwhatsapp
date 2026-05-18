import { Header } from '@/components/shared/header'
import { SessionManager } from '@/components/whatsapp/session-manager'

export default function ConfiguracoesPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Configurações" />
      <div className="p-6 space-y-6">
        <SessionManager />
      </div>
    </div>
  )
}
