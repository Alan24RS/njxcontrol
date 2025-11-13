import { ReactNode } from 'react'

import { Breadcrumb } from '@/components/layout'
import type { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { cn } from '@/lib/utils'

export default function PageContainer({
  children,
  className,
  breadcrumb,
  breadcrumbPrefix
}: {
  children: ReactNode
  className?: string
  breadcrumb?: BreadcrumbItem[]
  breadcrumbPrefix?: string
}) {
  return (
    <>
      <Breadcrumb custom={breadcrumb} prefix={breadcrumbPrefix || '/admin'} />
      <section className={cn('flex grow flex-col pb-6', className)}>
        {children}
      </section>
    </>
  )
}
