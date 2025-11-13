'use client'

import { Link } from 'next-view-transitions'

import {
  CheckCircle,
  Edit,
  Eye,
  type LucideIcon,
  MoreVertical,
  RefreshCw,
  Trash2,
  XCircle
} from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type IconName =
  | 'edit'
  | 'delete'
  | 'view'
  | 'check'
  | 'cancel'
  | 'refresh'
  | 'more'

const iconMap: Record<IconName, LucideIcon> = {
  edit: Edit,
  delete: Trash2,
  view: Eye,
  check: CheckCircle,
  cancel: XCircle,
  refresh: RefreshCw,
  more: MoreVertical
}

const iconColorMap: Record<IconName, string> = {
  delete: 'text-destructive hover:text-destructive',
  cancel: 'text-destructive hover:text-destructive',
  edit: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
  view: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
  check:
    'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
  refresh:
    'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
  more: 'text-muted-foreground hover:text-foreground'
}

interface ActionColumnButtonProps {
  icon: IconName
  tooltip: string
  onClick?: (e?: React.MouseEvent) => void
  href?: string
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  disabled?: boolean
  className?: string
}

export function ActionColumnButton({
  icon,
  tooltip,
  onClick,
  href,
  variant = 'ghost',
  disabled = false,
  className
}: ActionColumnButtonProps) {
  const Icon = iconMap[icon]

  if (!Icon) {
    console.warn(`Icon "${icon}" not found in iconMap`)
    return null
  }

  const buttonClasses = cn(
    buttonVariants({ variant, size: 'sm' }),
    'h-8 w-8 p-0',
    className
  )

  const iconColor = iconColorMap[icon]

  const content = (
    <>
      <span className="sr-only">{tooltip}</span>
      <Icon className={cn('h-4 w-4', iconColor)} />
    </>
  )

  const button = href ? (
    <Link
      href={href}
      className={buttonClasses}
      onClick={(e) => {
        if (onClick) {
          onClick(e as any)
        }
        e.stopPropagation()
      }}
    >
      {content}
    </Link>
  ) : (
    <Button
      variant={variant}
      size="sm"
      className={cn('h-8 w-8 p-0', className)}
      onClick={(e) => {
        if (onClick) {
          onClick(e)
        }
        e.stopPropagation()
      }}
      disabled={disabled}
    >
      {content}
    </Button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
