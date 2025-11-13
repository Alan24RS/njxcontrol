'use client'

import { Link } from 'next-view-transitions'

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Info,
  RefreshCw
} from 'lucide-react'

import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui'
import { cn } from '@/lib/utils'

interface MessageCardProps {
  title?: string
  description?: string
  content?: string
  type?: 'error' | 'warning' | 'info' | 'success'
  actionButton?: React.ReactNode
  actionLink?: {
    label: string
    href: string
  }
  children?: React.ReactNode
  className?: string
}

const iconVariants = {
  error: {
    icon: AlertCircle,
    className: 'text-destructive bg-destructive/10'
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-yellow-500 bg-yellow-500/10'
  },
  info: {
    icon: Info,
    className: 'text-blue-500 bg-blue-500/10'
  },
  success: {
    icon: CheckCircle,
    className: 'text-green-500 bg-green-500/10'
  }
}

export function MessageCard({
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado',
  content = 'Por favor, intentá nuevamente en unos momentos.',
  type = 'error',
  actionButton,
  actionLink,
  children,
  className
}: MessageCardProps) {
  const { icon: Icon, className: iconClassName } = iconVariants[type]

  return (
    <div
      className={cn(
        'bg-background flex h-full w-full grow items-center justify-center p-4',
        className
      )}
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
              iconClassName
            )}
          >
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {children || (
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p>{content}</p>
            </div>
          )}
          {!actionButton && actionLink && (
            <Link
              className={cn(buttonVariants(), 'w-full')}
              href={actionLink.href}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {actionLink.label}
            </Link>
          )}
          {actionButton ||
            (!actionButton && !actionLink && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar nuevamente
              </Button>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
