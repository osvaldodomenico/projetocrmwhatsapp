import { Header } from '@/components/shared/header'
import { CampaignDetail } from '@/components/campaigns/campaign-detail'

export default function CampaignPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Campanha" />
      <div className="p-6">
        <CampaignDetail campaignId={params.id} />
      </div>
    </div>
  )
}
