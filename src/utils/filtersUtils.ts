import { ReadonlyURLSearchParams } from 'next/navigation'

import type { PaginationParams } from '@/types/api'

const paginationKeys = new Set<keyof PaginationParams>([
  'limit',
  'page',
  'sortBy',
  'order',
  'query'
])

export const getFiltersApplied = (params: ReadonlyURLSearchParams) => {
  const entries = Array.from(params.entries())
  const filtersApplied = entries.filter(
    ([key]) => !paginationKeys.has(key as keyof PaginationParams)
  )
  const uniqueEntries = new Map<string, string>()

  filtersApplied.forEach(([key, value]) => {
    if (key === 'fromDate' || key === 'toDate') {
      uniqueEntries.set('date', 'true')
    } else {
      uniqueEntries.set(key, value)
    }
  })

  const uniqueFiltersApplied = Array.from(uniqueEntries.entries())

  return {
    filtersApplied,
    uniqueFiltersApplied
  }
}
