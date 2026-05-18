import { Header } from '@/components/shared/header'
import { CampaignsList } from '@/components/campaigns/campaigns-list'

export default function CampanhasPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Campanhas" />
      <div className="p-6">
        <CampaignsList />
      </div>
    </div>
  )
}
