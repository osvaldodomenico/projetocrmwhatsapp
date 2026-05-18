import { Header } from '@/components/shared/header'
import { FollowUpsManager } from '@/components/follow-ups/follow-ups-manager'

export default function FollowUpsPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Follow-ups" />
      <div className="p-6">
        <FollowUpsManager />
      </div>
    </div>
  )
}
