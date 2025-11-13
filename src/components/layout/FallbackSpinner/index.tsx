import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function FallbackSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex w-full grow items-center justify-center', className)}
    >
      <Spinner />
    </div>
  )
}
