export type SearchParamsType = Promise<{
  [key: string]: string | string[] | undefined
}>

export type PaginationParams = {
  page?: number
  limit?: number
  query?: string
}
