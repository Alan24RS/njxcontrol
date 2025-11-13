'use client'

import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLegacy,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui'
import useQueryParams from '@/hooks/useQueryParams'

export default function Pagination({
  currentPage = 1,
  lastPage = 1
}: {
  currentPage?: number
  lastPage?: number
}) {
  const { generateURLParams, actualPath } = useQueryParams()

  const canPreviousPage = currentPage > 1

  const canNextPage = currentPage < lastPage

  const previousPageUrl = generateURLParams({
    name: 'page',
    value: (currentPage - 1).toString()
  })

  const nextPageUrl = generateURLParams({
    name: 'page',
    value: (currentPage + 1).toString()
  })

  const lastPageUrl = generateURLParams({
    name: 'page',
    value: lastPage.toString()
  })

  const firstPageUrl = generateURLParams({
    name: 'page',
    value: '1'
  })

  return (
    <PaginationLegacy className="my-4">
      <PaginationContent>
        {canPreviousPage && (
          <PaginationItem>
            <PaginationPrevious
              href={previousPageUrl}
              className="hover:border-brand hover:bg-background min-w-10 rounded-full border border-transparent"
            />
          </PaginationItem>
        )}
        {currentPage > 1 && (
          <PaginationLink
            href={firstPageUrl}
            className="hover:border-brand hover:bg-background rounded-full p-2 hover:border"
          >
            1
          </PaginationLink>
        )}
        {currentPage > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationLink
            href={actualPath}
            className="bg-brand hover:bg-brand hover:bg-background pointer-events-none rounded-full p-2 text-white duration-100 hover:text-white"
          >
            {currentPage}
          </PaginationLink>
        </PaginationItem>
        {currentPage < lastPage - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {currentPage < lastPage && (
          <PaginationLink
            href={lastPageUrl}
            className="hover:border-brand hover:bg-background rounded-full p-2 hover:border"
          >
            {lastPage}
          </PaginationLink>
        )}
        {canNextPage && (
          <PaginationItem>
            <PaginationNext
              href={nextPageUrl}
              className="hover:border-brand hover:bg-background min-w-10 rounded-full border border-transparent"
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationLegacy>
  )
}
