'use client'

import { Link } from 'next-view-transitions'

import Isologo from '@/assets/institutional/Isologo'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { Playa } from '@/services/playas/types'
import { User } from '@/types/auth'

import PlayaSelector from '../PlayaSelector'

import { general, playaActual } from './data'
import { NavUser } from './nav-user'
import SidebarSection from './Section'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: User
  playas: Playa[]
}

export function AppSidebar({ user, playas, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" className="px-0" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black p-2 text-white">
                  <Isologo className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Valet</span>
                  <span className="truncate text-xs">Panel administrativo</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarSection
            title="General"
            items={general}
            userRoles={user.roles}
          />
          <SidebarSection
            title="Playa actual"
            items={playaActual}
            userRoles={user.roles}
            className="bg-foreground/5"
          >
            <PlayaSelector playas={playas} />
          </SidebarSection>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name || 'Invitado',
            email: user?.email || 'Inicia sesión para ver más',
            avatar: user?.avatar || ''
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
