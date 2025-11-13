import { cn } from '@/lib/utils'

export default function PageHeader({
  title,
  description,
  children,
  className
}: {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex w-full justify-between px-6 sm:px-0', className)}>
      <div>
        <h1>{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      {children}
    </div>
  )
}
