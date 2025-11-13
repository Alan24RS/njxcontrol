'use client'

import { useState } from 'react'

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState
} from '@tanstack/react-table'

import {
  ScrollArea,
  ScrollBar,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useSidebar
} from '@/components/ui'
import { DataTablePagination } from '@/components/ui/DataTable'
import { useHiddenColumnsContext } from '@/contexts'
import type { Pagination } from '@/types/api'

export default function DataTable({
  data,
  pagination,
  columns,
  onRowClick
}: {
  data: any
  pagination: Pagination
  columns: any
  onRowClick?: (row: any) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const { hiddenColumns, isLoaded } = useHiddenColumnsContext()
  const { state } = useSidebar()
  const scrollAreaWidthClass =
    state === 'collapsed'
      ? 'sm:w-[calc(100vw-64px)]'
      : 'sm:w-[calc(100vw-48px)] md:w-[calc(100vw-314px)]'

  const columnVisibility: VisibilityState = hiddenColumns.reduce(
    (acc, columnId) => {
      acc[columnId] = false
      return acc
    },
    {} as VisibilityState
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  })

  return (
    <div className="flex w-full grow flex-col gap-4">
      <ScrollArea
        className={`w-full grow overflow-x-hidden ${scrollAreaWidthClass}`}
      >
        {!isLoaded ? (
          <div className="absolute top-0 left-0 z-10 grid h-full w-full place-content-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="h-fit w-full border sm:rounded-md">
              <Table className="bg-background w-full overflow-hidden sm:rounded-md">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} className="bg-accent p-0">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={
                          onRowClick ? 'hover:bg-accent/50 cursor-pointer' : ''
                        }
                        onClick={() => onRowClick?.(row)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="relative h-full p-4 has-[.cell-link]:p-0"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="pointer-events-none h-40 text-center"
                      >
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </>
        )}
      </ScrollArea>
      <DataTablePagination table={table} pagination={pagination} />
    </div>
  )
}
