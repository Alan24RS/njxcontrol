import { ReactNode } from 'react'

import { Link } from 'next-view-transitions'

import { Button, buttonVariants } from '@/components/ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WidgetProps {
  title: string
  description?: string
  icon?: ReactNode
  value?: string | number
  className?: string
  children?: ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  isVisible?: boolean
}

export function Widget({
  title,
  description,
  icon,
  value,
  className,
  children,
  action,
  isVisible = true
}: WidgetProps) {
  if (!isVisible) return null

  return (
    <Card className={cn('h-fit', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {icon && (
            <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {value !== undefined && (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {children}
        {action && action.href && (
          <Link
            className={cn(buttonVariants(), 'w-full rounded-md')}
            href={action.href}
          >
            {action.label}
          </Link>
        )}
        {action && action.onClick && (
          <Button className="w-full" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
