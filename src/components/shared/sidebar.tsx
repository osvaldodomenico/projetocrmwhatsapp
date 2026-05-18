'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Megaphone, Calendar, Settings, MessageSquare, MessagesSquare, Tag, ChevronRight, UserCog, Kanban } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contatos', label: 'Contatos', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/conversas', label: 'Conversas', icon: MessagesSquare },
  { href: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/follow-ups', label: 'Follow-ups', icon: Calendar },
  { href: '/tags', label: 'Tags', icon: Tag },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/usuarios', label: 'Usuários', icon: UserCog },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-600/20">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Shift CRM Whatsapp</h1>
            <p className="text-slate-500 text-xs">CRM</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
