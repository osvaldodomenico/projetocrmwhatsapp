import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatsCardProps = {
  title: string
  value: number | string
  icon: LucideIcon
  description?: string
  variant?: 'default' | 'hot' | 'cold' | 'warm' | 'danger'
}

const variants = {
  default: 'text-purple-400 bg-purple-400/10',
  hot: 'text-red-400 bg-red-400/10',
  cold: 'text-blue-400 bg-blue-400/10',
  warm: 'text-yellow-400 bg-yellow-400/10',
  danger: 'text-orange-400 bg-orange-400/10',
}

export function StatsCard({ title, value, icon: Icon, description, variant = 'default' }: StatsCardProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <div className={cn('p-2 rounded-lg', variants[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{Number(value).toLocaleString('pt-BR')}</p>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
