'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  flexRender,
  getCoreRowModel,
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
import { Button } from '@/components/ui/button'
import Filters from '@/components/ui/DataTable/Filters'
import { Pill, PillIndicator } from '@/components/ui/pill'
import { ROL } from '@/constants/rol'
import { useGetOcupaciones } from '@/hooks/queries/ocupaciones/getOcupaciones'
import { useGetPlazas } from '@/hooks/queries/plazas/getPlazas'
import { useTurnoActivo } from '@/hooks/queries/turnos/useTurnoActivo'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'
import { User } from '@/types/auth'

import type { PageParams } from '../../page'

import { getColumns } from './columns'

interface TableContainerProps {
  params: Partial<PageParams>
  user: User | null
}

export default function TableContainer({ params, user }: TableContainerProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    estadoPlaza: false // Ocultar columna "Estado Plaza" por defecto
  })
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()
  const { state } = useSidebar()

  // Mantener la fecha actualizada periódicamente para cálculos precisos de duración
  const [now, setNow] = useState(() => new Date())

  // Actualizar 'now' cada 60 segundos para sincronizar con el auto-refresh de datos
  // Esto asegura que los cálculos de duración sean precisos con el tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // 60 segundos
    return () => clearInterval(interval)
  }, [])

  // Memoizar columnas con la fecha actual
  const columns = useMemo(() => getColumns(now), [now])

  // Calcular ancho dinámico según estado del sidebar
  const scrollAreaWidthClass =
    state === 'collapsed'
      ? 'sm:w-[calc(100vw-64px)]'
      : 'sm:w-[calc(100vw-48px)] md:w-[calc(100vw-314px)]'

  // Verificar si el usuario es playero de la playa actual
  const { data: turnoResponse, isLoading: turnoLoading } = useTurnoActivo({
    enabled: !user?.roles?.includes(ROL.DUENO)
  })

  // Obtener plazas disponibles y totales para el indicador
  const { data: plazasDisponiblesResponse } = useGetPlazas(
    {
      playaId: selectedPlaya?.id || '',
      onlyAvailable: true,
      estado: 'ACTIVO',
      page: 1,
      limit: 1000
    },
    {
      enabled: !!selectedPlaya?.id
    }
  )

  const { data: plazasResponse } = useGetPlazas(
    {
      playaId: selectedPlaya?.id || '',
      estado: 'ACTIVO',
      page: 1,
      limit: 1000 // Obtener todas para contar
    },
    {
      enabled: !!selectedPlaya?.id
    }
  )

  const plazasDisponibles = plazasDisponiblesResponse?.data?.length || 0
  const totalPlazas = plazasResponse?.pagination?.total || 0

  // Combinar params de URL con filtros
  const queryParams = useMemo(
    () => ({
      ...params,
      playaId: selectedPlaya?.id || '',
      page: 1,
      limit: 50,
      includeFilters: true
    }),
    [params, selectedPlaya?.id]
  )

  const {
    data: response,
    error,
    isLoading: ocupacionesLoading,
    isError,
    refetch
  } = useGetOcupaciones(queryParams)

  // Inicializar TanStack Table (debe estar antes de los returns condicionales)
  const table = useReactTable({
    data: response?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility
    }
  })

  const isLoading = playaLoading || turnoLoading || ocupacionesLoading

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!selectedPlaya) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Selecciona una playa</h3>
          <p className="text-muted-foreground">
            Debes seleccionar una playa para ver las ocupaciones
          </p>
        </div>
      </div>
    )
  }

  // Esperar a que se verifique si el usuario es playero antes de decidir sobre el turno
  if (turnoLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  // Solo validar turno activo si el usuario es playero de esta playa
  // (incluso si también es dueño, debe tener turno activo si es playero)
  if (!user?.roles?.includes(ROL.DUENO) && !turnoResponse?.data) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Sin turno activo</h3>
          <p className="text-muted-foreground">
            Debes iniciar un turno para ver las ocupaciones
          </p>
        </div>
      </div>
    )
  }

  if (isError || error || !response?.data) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Hubo un problema</h3>
          <p className="text-muted-foreground">
            {response?.error ||
              'Intente nuevamente o comuníquese con el área de sistemas'}
          </p>
        </div>
      </div>
    )
  }

  // Preparar mensaje de estado vacío
  const emptyStateTitle = 'Sin ocupaciones'
  const emptyStateMessage =
    'No hay ocupaciones que coincidan con los filtros aplicados'

  return (
    <div className="flex w-full grow flex-col gap-4">
      {/* Indicador de plazas disponibles */}
      {selectedPlaya && (
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Pill variant="secondary" className="font-medium">
            <PillIndicator
              variant={
                plazasDisponibles === 0
                  ? 'error'
                  : plazasDisponibles < totalPlazas * 0.2
                    ? 'warning'
                    : 'success'
              }
              pulse={plazasDisponibles === 0}
            />
            <span className="text-sm">
              Plazas disponibles:{' '}
              <span className="font-semibold">
                {plazasDisponibles}/{totalPlazas}
              </span>
            </span>
          </Pill>
        </div>
      )}
      {/* Filtros y contador de plazas */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros */}
          <Filters filters={response?.filters} loading={ocupacionesLoading} />
        </div>
      </div>

      {/* Contenido: Tabla o mensaje vacío */}
      {!response?.data || response.data.length === 0 ? (
        <div className="flex w-full grow items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{emptyStateTitle}</h3>
            <p className="text-muted-foreground">{emptyStateMessage}</p>
            <div className="mt-4">
              <Button onClick={() => refetch()}>Actualizar listado</Button>
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea
          className={`scrollbar-gutter-stable w-full grow overflow-x-auto ${scrollAreaWidthClass}`}
        >
          <div className="h-fit w-full border sm:rounded-md">
            <Table className="bg-background w-full border-separate border-spacing-0 overflow-hidden sm:rounded-md">
              <TableHeader className="bg-background sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-accent p-0 whitespace-nowrap"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
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
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
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
                      Sin resultados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
