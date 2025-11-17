'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { ChevronRightIcon } from '@radix-ui/react-icons'
import { type LucideIcon } from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'
import { type Role } from '@/constants/rol'

export type SidebarItem = {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  roles: Role[]
  items?: {
    title: string
    url: string
  }[]
  children?: React.ReactNode
}

export default function SidebarSection({
  items,
  title,
  userRoles,
  children,
  className
}: {
  title: string
  items: SidebarItem[]
  userRoles: Role[]
  children?: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActualPath = (url: string) => {
    // Coincidencia exacta
    if (pathname === url) return true

    // Verificar con query params
    const currentUrl =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (currentUrl === url) return true

    // No marcar rutas padre cuando estamos en rutas hijas
    // Solo marcar si el item tiene sub-items Y estamos en uno de ellos
    return false
  }

  const filteredItems = items.filter((item) => {
    return item.roles.some((role) => userRoles.includes(role))
  })

  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {children}
        {filteredItems.map((item) => (
          <Collapsible key={item.url} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                data-actual-path={isActualPath(item.url)}
                className="data-[actual-path=true]:bg-accent-foreground/10 data-[actual-path=true]:text-accent-foreground data-[actual-path=true]:hover:bg-accent data-[actual-path=true]:hover:text-primary data-[actual-path=true]:font-semibold"
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction
                      data-actual-path={isActualPath(item.url)}
                      className="peer-hover/menu-button:text-sidebar-accent-foreground data-[actual-path=true]:bg-primary/50 data-[actual-path=true]:text-background data-[actual-path=true]:peer-hover/menu-button:text-background dark:data-[actual-path=true]:peer-hover/menu-button:text-background data-[state=open]:rotate-90"
                    >
                      <ChevronRightIcon />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            data-actual-path={isActualPath(subItem.url)}
                            className="data-[actual-path=true]:bg-primary/20 data-[actual-path=true]:text-primary data-[actual-path=true]:font-medium"
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
