type SupabaseQueryBuilder = any

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  column: string
  direction: SortDirection
}

export interface SortMapping {
  [frontendId: string]: string
}

export interface ApplySortingOptions {
  sortBy?: string | string[]
  columnMapping: SortMapping
  defaultSort?: SortConfig
}

export function parseSortParam(sortParam: string): SortConfig {
  const sortParts = sortParam.trim().split(' ')
  const column = sortParts[0]
  const direction = sortParts[1] === 'desc' ? 'desc' : 'asc'

  return { column, direction }
}

export function processSortParams(
  sortBy: string | string[] | undefined,
  columnMapping: SortMapping
): SortConfig[] {
  if (!sortBy) {
    return []
  }

  const sortArray = Array.isArray(sortBy) ? sortBy : [sortBy]

  if (sortArray.length === 0) {
    return []
  }

  const sortConfigs: SortConfig[] = []

  for (const sortParam of sortArray) {
    const { column: frontendId, direction } = parseSortParam(sortParam)

    if (columnMapping[frontendId]) {
      const dbField = columnMapping[frontendId]
      sortConfigs.push({
        column: dbField,
        direction
      })
    } else {
      console.warn(`Columna de sorting no válida: ${frontendId}`)
    }
  }

  return sortConfigs
}

export function applySorting(
  query: SupabaseQueryBuilder,
  options: ApplySortingOptions
): SupabaseQueryBuilder {
  const { sortBy, columnMapping, defaultSort } = options

  const sortConfigs = processSortParams(sortBy, columnMapping)

  if (sortConfigs.length === 0 && defaultSort) {
    return query.order(defaultSort.column, {
      ascending: defaultSort.direction === 'asc',
      nullsFirst: false
    })
  }

  let sortedQuery = query
  for (const config of sortConfigs) {
    sortedQuery = sortedQuery.order(config.column, {
      ascending: config.direction === 'asc',
      nullsFirst: false
    })
  }

  return sortedQuery
}

export function createColumnMapping(
  mapping: Record<string, string>
): Record<string, string> {
  return mapping
}

export function remapSort(
  sortBy: string | string[] | undefined,
  columnMapping: SortMapping,
  defaultDirection: SortDirection = 'asc'
): string | undefined {
  if (!sortBy) return undefined
  const raw = Array.isArray(sortBy) ? sortBy[0] : sortBy
  if (!raw) return undefined

  const [maybeCol, maybeDir] = String(raw)
    .split(' ')
    .map((s) => s.trim().toLowerCase())

  const mapped = columnMapping[maybeCol]
  if (!mapped) return undefined

  const dir = (maybeDir || '').toLowerCase()
  if (dir === 'asc' || dir === 'desc') return `${mapped} ${dir}`
  return `${mapped} ${defaultDirection}`
}
