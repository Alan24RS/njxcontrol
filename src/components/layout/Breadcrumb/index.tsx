'use client'

import { Fragment } from 'react'

import { usePathname } from 'next/navigation'

import { Link } from 'next-view-transitions'

import { playaActual } from '@/components/layout/Sidebar/data'
import {
  Breadcrumb as BreadcrumbLegacy,
  BreadcrumbItem as BreadcrumbItemLegacy,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
  SidebarTrigger,
  Skeleton
} from '@/components/ui'
import { breadcrumbPaths } from '@/constants/breadcrumb'
import { cn } from '@/lib/utils'
import { useSelectedPlaya } from '@/stores'

export type BreadcrumbItem = {
  label: string
  href?: string
  className?: string
  onClick?: (value: any) => void
  isPlayaItem?: boolean
  isLoading?: boolean
}

const formatSlug = (slug: string): string => {
  const withSpaces = slug.replace(/-/g, ' ')
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}

const getLabelForSegment = (segment: string): string => {
  return (
    breadcrumbPaths[segment as keyof typeof breadcrumbPaths] ||
    formatSlug(segment)
  )
}

const BreadcrumbItem = (item: BreadcrumbItem) => {
  const { label, className, href, onClick } = item
  return (
    <BreadcrumbItemLegacy className={'contents'}>
      {!href ? (
        <button onClick={onClick}>{label}</button>
      ) : (
        <BreadcrumbLink asChild>
          <Link className={cn('contents', className)} href={href}>
            {label}
          </Link>
        </BreadcrumbLink>
      )}
    </BreadcrumbItemLegacy>
  )
}

const isPlayaActualRoute = (pathname: string): boolean => {
  const playaActualUrls = playaActual.map((item) => item.url)
  return playaActualUrls.some((url) => pathname.startsWith(url))
}

export default function Breadcrumb({
  custom,
  className,
  prefix
}: {
  custom?: BreadcrumbItem[]
  className?: string
  prefix?: string
}) {
  const pathname = usePathname()
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    if (custom) return custom

    const pathSegments = pathname.split('/').filter(Boolean)
    const shouldIncludePlaya = isPlayaActualRoute(pathname)
    const items: BreadcrumbItem[] = []

    if (prefix) {
      const prefixSegments = prefix.split('/').filter(Boolean)
      const prefixKey = prefixSegments[prefixSegments.length - 1]
      items.push({
        label: getLabelForSegment(prefixKey),
        href: prefix
      })

      if (shouldIncludePlaya) {
        items.push({
          label: selectedPlaya?.nombre || '',
          href: selectedPlaya?.id
            ? `/admin/playas/${selectedPlaya.id}`
            : undefined,
          isPlayaItem: true,
          isLoading: playaLoading
        })
      }

      const remainingPath = pathname.replace(prefix, '')
      const remainingSegments = remainingPath.split('/').filter(Boolean)

      remainingSegments.forEach((segment, index) => {
        const href = `${prefix}/${remainingSegments.slice(0, index + 1).join('/')}`
        items.push({
          label: getLabelForSegment(segment),
          href
        })
      })
    } else {
      items.push({ label: 'Inicio', href: '/' })

      if (shouldIncludePlaya) {
        items.push({
          label: selectedPlaya?.nombre || '',
          href: selectedPlaya?.id
            ? `/admin/playas/${selectedPlaya.id}`
            : undefined,
          isPlayaItem: true,
          isLoading: playaLoading
        })
      }

      if (pathSegments.length > 0) {
        items.push({
          href: `/${pathSegments[0]}`,
          label: getLabelForSegment(pathSegments[0])
        })
      }
    }

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <BreadcrumbLegacy className={cn('bg-background flex', className)}>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1

              if (item.isPlayaItem) {
                if (item.isLoading) {
                  return (
                    <Fragment key={`playa-${index}`}>
                      <BreadcrumbItemLegacy>
                        <Skeleton className="h-4 w-24" />
                      </BreadcrumbItemLegacy>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  )
                }

                if (!item.label) return null

                return (
                  <Fragment key={`playa-${index}`}>
                    {isLast ? (
                      <BreadcrumbItemLegacy>
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      </BreadcrumbItemLegacy>
                    ) : (
                      <>
                        <BreadcrumbItem {...item} />
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </Fragment>
                )
              }

              return (
                <Fragment key={index}>
                  {isLast ? (
                    <BreadcrumbItemLegacy>
                      <BreadcrumbPage className={cn(item.className)}>
                        {item.label}
                      </BreadcrumbPage>
                    </BreadcrumbItemLegacy>
                  ) : (
                    <>
                      <BreadcrumbItem {...item} />
                      <BreadcrumbSeparator />
                    </>
                  )}
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </BreadcrumbLegacy>
      </div>
    </header>
  )
}
