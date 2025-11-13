import type { PaginationParams } from '@/types/api'

export const getPagination = (args: PaginationParams) => {
  const page = Number(args.page || 1)
  const limit = Number(args.limit || 10)
  const skip = limit * (page - 1)

  return {
    page,
    limit,
    skip
  }
}
