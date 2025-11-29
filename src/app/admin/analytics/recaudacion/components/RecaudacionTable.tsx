'use client'

import { useMemo, useState } from 'react'

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { PagoDetalleRow } from '@/services/analytics/recaudacion/types'

interface RecaudacionTableProps {
  data: PagoDetalleRow[]
}

export function RecaudacionTable({ data }: RecaudacionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'fecha', desc: true }
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  // Filtros locales
  const [filterPlaya, setFilterPlaya] = useState('')
  const [filterPlayero, setFilterPlayero] = useState('')
  const [filterTipo, setFilterTipo] = useState<'all' | 'ABONO' | 'OCUPACION'>(
    'all'
  )

  // Aplicar filtros en memoria
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchPlaya =
        filterPlaya === '' ||
        row.playa_nombre.toLowerCase().includes(filterPlaya.toLowerCase())
      const matchPlayero =
        filterPlayero === '' ||
        (row.playero_nombre ?? '')
          .toLowerCase()
          .includes(filterPlayero.toLowerCase())
      const matchTipo = filterTipo === 'all' || row.tipo === filterTipo
      return matchPlaya && matchPlayero && matchTipo
    })
  }, [data, filterPlaya, filterPlayero, filterTipo])

  const columns: ColumnDef<PagoDetalleRow>[] = useMemo(
    () => [
      {
        accessorKey: 'fecha',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Fecha
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const fecha = new Date(row.getValue('fecha'))
          return new Intl.DateTimeFormat('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(fecha)
        }
      },
      {
        accessorKey: 'playa_nombre',
        header: 'Playa'
      },
      {
        accessorKey: 'playero_nombre',
        header: 'Playero',
        cell: ({ row }) => row.getValue('playero_nombre') || '—'
      },
      {
        accessorKey: 'tipo',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tipo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const tipo = row.getValue<'ABONO' | 'OCUPACION' | 'OTRO'>('tipo')
          let label = 'Otro'
          if (tipo === 'ABONO') label = 'Abono'
          else if (tipo === 'OCUPACION') label = 'Ocupación'
          return <div>{label}</div>
        }
      },
      {
        accessorKey: 'monto',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Monto
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const amount = row.getValue<number>('monto')
          const formatted = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount)
          return (
            <div className="center font-bold text-green-600">{formatted}</div>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination
    }
  })

  return (
    <div className="space-y-4">
      {/* Filtros de tabla */}
      <div className="bg-card flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Buscar Playa
          </label>
          <div className="relative">
            <Input
              placeholder="Filtrar por playa..."
              value={filterPlaya}
              onChange={(e) => setFilterPlaya(e.target.value)}
              className="pr-8"
              name={''}
            />
            {filterPlaya && (
              <button
                onClick={() => setFilterPlaya('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="min-w-[200px] flex-1">
          <label className="mb-1.5 block text-sm font-medium">
            Buscar Playero
          </label>
          <div className="relative">
            <Input
              placeholder="Filtrar por playero..."
              value={filterPlayero}
              onChange={(e) => setFilterPlayero(e.target.value)}
              className="pr-8"
              name={''}
            />
            {filterPlayero && (
              <button
                onClick={() => setFilterPlayero('')}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-[180px]">
          <label className="mb-1.5 block text-sm font-medium">Tipo</label>
          <Select
            value={filterTipo}
            onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ABONO">Abono</SelectItem>
              <SelectItem value="OCUPACION">Ocupación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filterPlaya || filterPlayero || filterTipo !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterPlaya('')
              setFilterPlayero('')
              setFilterTipo('all')
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm">
            Mostrando{' '}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{' '}
            a{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              filteredData.length
            )}{' '}
            de {filteredData.length} resultados
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Filas por página
            </span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Página {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount()}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
