import { Header } from '@/components/shared/header'
import { ContactsTable } from '@/components/contacts/contacts-table'

export default function ContactsPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Contatos" />
      <div className="flex-1 p-6">
        <ContactsTable />
      </div>
    </div>
  )
}
