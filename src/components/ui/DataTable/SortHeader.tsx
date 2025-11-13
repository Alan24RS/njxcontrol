import { ReactElement, ReactNode } from 'react'

import {
  ArrowDown10,
  ArrowDownZA,
  ArrowUp01,
  ArrowUpAZ,
  ArrowUpDown
} from 'lucide-react'

import { Button } from '@/components/ui'
import useQueryParams from '@/hooks/useQueryParams'
import { cn } from '@/lib/utils'

export default function SortHeader({
  children,
  id,
  type = 'number',
  className
}: {
  children: ReactNode
  id: string
  type?: 'string' | 'number'
  className?: string
}) {
  const { handleSortParams, searchParams } = useQueryParams()
  const sortItems = searchParams.getAll('sortBy')

  const sortIndex = sortItems.findIndex(
    (item) => item.split(' ').includes(id) || item === id
  )

  let sortDirection: 'asc' | 'desc' = 'asc'

  if (sortIndex >= 0) {
    const direction = sortItems[sortIndex].split(' ')[1]
    if (direction === 'asc' || direction === 'desc') {
      sortDirection = direction
    }
  }

  const filterKeys = [
    'estado',
    'tipoPlaza',
    'ciudad',
    'caracteristicas',
    'modalidadOcupacion',
    'tipoVehiculo'
  ]
  const hasActiveFilter = filterKeys.some(
    (key) => key === id && searchParams.getAll(key).length > 0
  )

  type IconDirection = {
    number: {
      asc: ReactElement
      desc: ReactElement
    }
    string: {
      asc: ReactElement
      desc: ReactElement
    }
  }

  const iconDirection: IconDirection = {
    string: {
      asc: <ArrowUpAZ className="ml-2 size-4" />,
      desc: <ArrowDownZA className="ml-2 size-4" />
    },
    number: {
      asc: <ArrowUp01 className="ml-2 size-4" />,
      desc: <ArrowDown10 className="ml-2 size-4" />
    }
  }

  const isActive = sortIndex >= 0 || hasActiveFilter

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        'flex w-full items-center justify-center has-[>svg]:px-2',
        isActive && 'text-primary hover:text-primary font-semibold',
        className
      )}
      onClick={(event) => handleSortParams(id, event)}
    >
      {children}
      <div className="hidden sm:block">
        {sortIndex >= 0 ? (
          iconDirection[type][sortDirection]
        ) : (
          <ArrowUpDown className="ml-2 size-4" />
        )}
      </div>
    </Button>
  )
}
