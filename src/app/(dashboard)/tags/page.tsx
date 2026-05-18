import { Header } from '@/components/shared/header'
import { TagsManager } from '@/components/tags/tags-manager'

export default function TagsPage() {
  return (
    <div className="flex flex-col flex-1 bg-slate-950">
      <Header title="Tags" />
      <div className="p-6">
        <TagsManager />
      </div>
    </div>
  )
}
