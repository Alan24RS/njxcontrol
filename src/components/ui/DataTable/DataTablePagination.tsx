import { Table } from '@tanstack/react-table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui'
import useQueryParams from '@/hooks/useQueryParams'
import type { Pagination } from '@/types/api'

interface IDataTablePagination<TData> {
  table: Table<TData>
  pagination: Pagination
}

export default function DataTablePagination<TData>({
  table,
  pagination
}: IDataTablePagination<TData>) {
  const { searchParams, handleParamsChange } = useQueryParams()

  const canPreviousPage = pagination.currentPage > 1

  const canNextPage = pagination.currentPage < pagination.lastPage

  const previousPage = () => {
    handleParamsChange({
      name: 'page',
      value: (pagination.currentPage - 1).toString()
    })
  }

  const nextPage = () => {
    handleParamsChange({
      name: 'page',
      value: (pagination.currentPage + 1).toString()
    })
  }

  return (
    <div className="flex items-center justify-between px-4 sm:px-0">
      <div className="flex w-full flex-col items-center justify-between gap-2 sm:flex-row sm:gap-6">
        <div className="flex w-full items-center justify-between gap-4">
          <p className="text-left text-sm font-medium">
            {pagination.total + (pagination.total === 1 ? ' ítem' : ' ítems')}
          </p>
          <div className="flex items-center justify-between gap-2 sm:w-fit sm:justify-start">
            <label
              htmlFor="items-per-page"
              className="text-right text-sm font-medium"
            >
              Items por página
            </label>
            <Select
              name="items-per-page"
              value={
                searchParams.get('limit') ??
                table.getState().pagination.pageSize.toString()
              }
              onValueChange={(value: string) => {
                table.setPageSize(Number(value))
                handleParamsChange([
                  { name: 'limit', value },
                  { name: 'page', value: '1' }
                ])
              }}
            >
              <SelectTrigger className="h-8 w-[70px]" id="items-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-6 sm:w-fit sm:justify-start">
          <p className="flex items-center justify-center text-sm font-medium whitespace-nowrap">
            Página {pagination.currentPage} de {pagination.lastPage}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handleParamsChange({ name: 'page', value: '1' })}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={previousPage}
              disabled={!canPreviousPage}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={nextPage}
              disabled={!canNextPage}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                handleParamsChange({
                  name: 'page',
                  value: pagination.lastPage.toString()
                })
              }
              disabled={!canNextPage}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
