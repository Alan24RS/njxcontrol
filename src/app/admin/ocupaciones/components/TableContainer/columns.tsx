'use client'

import type { ColumnDef, Row } from '@tanstack/react-table'

import { ActionColumnButton } from '@/components/ui'
import { SimpleHeader, SortHeader } from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { OCUPACION_ESTADO } from '@/constants/ocupacionEstado'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { OcupacionConRelaciones } from '@/services/ocupaciones/types'

const OcupacionActions = ({ row }: { row: Row<OcupacionConRelaciones> }) => {
  const { id, estado } = row.original
  const isActive = estado === OCUPACION_ESTADO.ACTIVO
  const isFinalizado = estado === OCUPACION_ESTADO.FINALIZADO

  return (
    <div className="flex w-full items-center justify-center gap-1">
      {!isFinalizado && (
        <ActionColumnButton
          icon="edit"
          tooltip="Editar ocupación"
          href={`/admin/ocupaciones/${id}/editar`}
        />
      )}
      {isActive && (
        <ActionColumnButton
          icon="check"
          tooltip="Finalizar ocupación"
          href={`/admin/ocupaciones/${id}/finalizar`}
        />
      )}
    </div>
  )
}

/**
 * Formatea la fecha de ingreso de manera inteligente:
 * - Solo hora si es hoy: "14:30"
 * - Con fecha si es otro día del mismo año: "18/10 14:30"
 * - Con año si es de otro año: "31/12/24 23:45"
 *
 * @param date - Fecha a formatear
 * @param now - Fecha actual (para evitar crear new Date() en cada render)
 */
function formatHoraIngreso(date: Date, now: Date): string {
  const isToday = date.toDateString() === now.toDateString()

  const isSameYear = date.getFullYear() === now.getFullYear()

  const timeStr = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Si es hoy, solo mostrar hora
  if (isToday) {
    return timeStr
  }

  // Si es del mismo año pero otro día, mostrar DD/MM HH:mm
  if (isSameYear) {
    const dateStr = date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    })
    return `${dateStr} ${timeStr}`
  }

  // Si es de otro año, mostrar DD/MM/AA HH:mm
  const dateStr = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
  return `${dateStr} ${timeStr}`
}

/**
 * Genera las definiciones de columnas para la tabla de ocupaciones.
 * La fecha actual se pasa como parámetro para evitar crear new Date() en cada render de celda.
 *
 * @param now - Fecha actual (opcional, se calcula si no se provee)
 * @returns Definiciones de columnas para TanStack Table
 */
export function getColumns(
  now: Date = new Date()
): ColumnDef<OcupacionConRelaciones>[] {
  return [
    {
      accessorKey: 'patente',
      id: 'patente',
      header: () =>
        SortHeader({
          children: 'Patente',
          id: 'patente',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="font-medium uppercase">{row.original.patente}</div>
        </div>
      )
    },
    {
      accessorKey: 'tipoVehiculo',
      id: 'tipo_vehiculo',
      header: () =>
        SortHeader({
          children: 'Tipo Vehículo',
          id: 'tipo_vehiculo',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="text-sm">
            {TIPO_VEHICULO_LABEL[row.original.tipoVehiculo]}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'modalidadOcupacion',
      id: 'modalidad_ocupacion',
      header: () =>
        SortHeader({
          children: 'Modalidad',
          id: 'modalidad_ocupacion',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="text-sm">
            {MODALIDAD_OCUPACION_LABEL[row.original.modalidadOcupacion]}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'plazaIdentificador',
      id: 'plaza',
      header: () =>
        SortHeader({
          children: 'Plaza',
          id: 'plaza',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex justify-center text-center">
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.plazaIdentificador}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.tipoPlazaNombre}
            </span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'horaIngreso',
      id: 'hora_ingreso',
      header: () =>
        SortHeader({
          children: 'Hora Ingreso',
          id: 'hora_ingreso',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const date = row.original.horaIngreso
        return (
          <div className="flex justify-center">
            <div className="text-sm">{formatHoraIngreso(date, now)}</div>
          </div>
        )
      }
    },
    {
      accessorKey: 'duracionMinutos',
      id: 'duracion',
      header: () =>
        SortHeader({
          children: (
            <div className="text-center whitespace-pre-line">
              {'Tiempo\ntranscurrido'}
            </div>
          ),
          id: 'duracion_minutos',
          type: 'number',
          className: 'justify-center'
        }),
      cell: ({ row }) => (
        <div className="flex justify-center p-1.5">
          <div className="font-mono text-sm">
            {row.original.duracionFormateada}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      header: () =>
        SortHeader({
          children: (
            <div className="text-center wrap-break-word whitespace-pre-line">
              {'Estado\nOcupación'}
            </div>
          ),
          id: 'estado_ocupacion',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const estado = row.original.estado
        const statusType: 'ACTIVO' | 'FINALIZADO' =
          estado === OCUPACION_ESTADO.ACTIVO ? 'ACTIVO' : 'FINALIZADO'
        return (
          <div className="flex justify-center">
            <StatusBadge status={statusType} />
          </div>
        )
      }
    },
    {
      accessorKey: 'playeroNombre',
      id: 'playeros',
      header: () =>
        SortHeader({
          children: (
            <div className="text-center whitespace-pre-line">
              {'Playeros\n(Abre/Cierra)'}
            </div>
          ),
          id: 'playeros',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const { playeroNombre, playeroCierreNombre, estado } = row.original
        const isFinalizado = estado === OCUPACION_ESTADO.FINALIZADO

        return (
          <div className="flex flex-col justify-center gap-1 text-center">
            <div className="text-sm">
              <span className="font-medium">Abre:</span>{' '}
              {playeroNombre ? (
                <span className="text-muted-foreground">{playeroNombre}</span>
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Sin información
                </span>
              )}
            </div>
            {isFinalizado && (
              <>
                {playeroCierreNombre ? (
                  <div className="text-sm">
                    <span className="font-medium">Cierra:</span>{' '}
                    <span className="text-muted-foreground">
                      {playeroCierreNombre}
                    </span>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-xs italic">
                    Cierra: Sin información
                  </div>
                )}
              </>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'plazaEstado',
      id: 'estadoPlaza',
      enableHiding: true,
      header: () =>
        SortHeader({
          children: 'Estado Plaza',
          id: 'plaza_estado',
          type: 'string',
          className: 'justify-center'
        }),
      cell: ({ row }) => {
        const estado = row.original.estado
        const plazaEstado = row.original.plazaEstado
        let statusType: 'ACTIVO' | 'SUSPENDIDO' | 'PENDIENTE' = 'ACTIVO'

        // Si la ocupación está activa, la plaza está ocupada
        if (estado === OCUPACION_ESTADO.ACTIVO) {
          statusType = 'PENDIENTE' // Usamos PENDIENTE para "Ocupada"
        }
        // Si la ocupación finalizó, la plaza está disponible (si está ACTIVO) o suspendida
        else if (plazaEstado === 'SUSPENDIDO') {
          statusType = 'SUSPENDIDO'
        } else {
          statusType = 'ACTIVO' // Disponible
        }

        // Personalizamos el label según el estado
        const customLabel =
          estado === OCUPACION_ESTADO.ACTIVO
            ? 'Ocupada'
            : plazaEstado === 'SUSPENDIDO'
              ? 'Suspendida'
              : 'Disponible'

        return (
          <div className="flex justify-center">
            <span
              className={
                statusType === 'PENDIENTE'
                  ? 'font-bold text-orange-500 dark:text-yellow-500'
                  : statusType === 'SUSPENDIDO'
                    ? 'font-bold text-red-600 dark:text-red-500'
                    : 'font-bold text-green-600 dark:text-green-400'
              }
            >
              {customLabel}
            </span>
          </div>
        )
      }
    },
    {
      id: 'actions',
      accessorKey: 'actions',
      header: () => <SimpleHeader>Acciones</SimpleHeader>,
      enableHiding: false,
      cell: ({ row }) => <OcupacionActions row={row} />
    }
  ]
}
