import { Header } from '@/components/shared/header'
import { NewCampaignForm } from '@/components/campaigns/new-campaign-form'

export default function NovaCampanhaPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Nova Campanha" />
      <div className="p-6 max-w-3xl">
        <NewCampaignForm />
      </div>
    </div>
  )
}
