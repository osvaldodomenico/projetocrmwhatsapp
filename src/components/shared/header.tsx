'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, UserCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { ProfileDialog } from '@/components/profile/profile-dialog'

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const [profileOpen, setProfileOpen] = useState(false)
  const name = session?.user?.name ?? 'Usuário'
  const image = session?.user?.image ?? null
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6">
      {title && <h2 className="text-white font-semibold">{title}</h2>}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-slate-300 hover:text-white bg-transparent border-none cursor-pointer rounded-md px-2 py-1 hover:bg-slate-800 transition-colors">
            <Avatar className="h-7 w-7">
              {image && <AvatarImage src={image} className="object-cover" />}
              <AvatarFallback className="bg-purple-600 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
            <DropdownMenuItem
              className="text-slate-300 cursor-pointer"
              onClick={() => setProfileOpen(true)}
            >
              <UserCircle className="mr-2 h-4 w-4" /> Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              className="text-slate-300 cursor-pointer"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
