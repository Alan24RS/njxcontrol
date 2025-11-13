import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Spinner component para estados de loading.
 * Usa el ícono Loader2 de Lucide React con animación de rotación.
 *
 * @example
 * ```tsx
 * <Spinner className="h-4 w-4" />
 * <Spinner className="h-8 w-8 text-primary" />
 * ```
 */
const Spinner = ({ className }: { className?: string }) => {
  return <Loader2 className={cn('size-4 animate-spin', className)} />
}

export { Spinner }
