export type ApiResponse<T> = {
  data: T | null
  error: string | null
  pagination?: Pagination
  filters?: Filters
}

export type Pagination = {
  currentPage: number
  lastPage: number
  total: number
  pageSize?: number
}

export type Filters = {
  [key: string]: {
    options: { label: string; value: string | number }[]
    pagination?: boolean
    title: string
  }
}

export type PaginationParams = {
  limit?: number
  page?: number
  sortBy?: string | string[]
  order?: string[]
  query?: string
  includeFilters?: boolean
}

export type SortBy = [string, 'asc' | 'desc']

export type FilterOption = {
  label: string
  value: string | number
}
