'use client'

import { useEffect, useState } from 'react'

import { CreditCard, DollarSign, Smartphone } from 'lucide-react'

import { MessageCard } from '@/components/ui/MessageCard'
import { Separator } from '@/components/ui/separator'
import { METODO_PAGO, METODO_PAGO_LABEL } from '@/constants/metodoPago'
import { getReporteTurnoActual } from '@/services/reportes/getReporteTurnoActual'
import type { Turno } from '@/services/turnos'
import { formatCurrency } from '@/utils/formatters'
import { formatDate } from '@/utils/formatUtils'

const METODO_PAGO_ICONS = {
  [METODO_PAGO.EFECTIVO]: DollarSign,
  [METODO_PAGO.TRANSFERENCIA]: CreditCard,
  [METODO_PAGO.MERCADO_PAGO]: Smartphone
}

interface ReporteTurnoActualContentProps {
  turno: Turno
}

export function ReporteTurnoActualContent({
  turno
}: ReporteTurnoActualContentProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reporte, setReporte] =
    useState<Awaited<ReturnType<typeof getReporteTurnoActual>>['data']>(null)

  useEffect(() => {
    async function loadReporte() {
      setLoading(true)
      setError(null)

      const response = await getReporteTurnoActual(turno)

      if (response.error || !response.data) {
        setError(
          response.error || 'No se pudo cargar el reporte del turno actual.'
        )
      } else {
        setReporte(response.data)
      }

      setLoading(false)
    }

    void loadReporte()
  }, [turno])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando reporte...</p>
      </div>
    )
  }

  if (error || !reporte) {
    return (
      <MessageCard
        title="Error al Cargar Reporte"
        description={error || 'No se pudo cargar el reporte del turno actual.'}
        type="error"
      />
    )
  }

  const {
    recaudacion_total,
    total_pagos,
    recaudacion_ocupaciones,
    recaudacion_boletas,
    cantidad_pagos_ocupaciones,
    cantidad_pagos_boletas,
    pagos_por_metodo
  } = reporte

  return (
    <div className="space-y-6">
      {/* Info del Turno */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Información del Turno</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Playa</p>
            <p className="font-medium">{turno.playaNombre}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Inicio</p>
            <p className="font-medium">{formatDate(turno.fechaHoraIngreso)}</p>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm font-medium">
            Total Recaudado
          </p>
          <p className="text-primary mt-2 text-3xl font-bold">
            {formatCurrency(recaudacion_total)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {total_pagos} pago{total_pagos !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm font-medium">
            Ocupaciones
          </p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(recaudacion_ocupaciones)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {cantidad_pagos_ocupaciones} pago
            {cantidad_pagos_ocupaciones !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <p className="text-muted-foreground text-sm font-medium">Boletas</p>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(recaudacion_boletas)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {cantidad_pagos_boletas} pago
            {cantidad_pagos_boletas !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Desglose por Método de Pago */}
      {pagos_por_metodo.length > 0 ? (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Desglose por Método de Pago
          </h2>
          <div className="space-y-4">
            {pagos_por_metodo.map((metodo, idx) => {
              const Icon =
                METODO_PAGO_ICONS[
                  metodo.metodo_pago as keyof typeof METODO_PAGO_ICONS
                ]
              const label =
                METODO_PAGO_LABEL[
                  metodo.metodo_pago as keyof typeof METODO_PAGO_LABEL
                ] || metodo.metodo_pago
              const porcentaje =
                recaudacion_total > 0
                  ? (metodo.monto / recaudacion_total) * 100
                  : 0

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        {Icon && <Icon className="text-primary h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{label}</p>
                        <p className="text-muted-foreground text-sm">
                          {metodo.tipo_pago === 'ocupacion'
                            ? 'Ocupaciones'
                            : 'Boletas'}{' '}
                          • {metodo.cantidad} pago
                          {metodo.cantidad !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(metodo.monto)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {porcentaje.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {idx < pagos_por_metodo.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <MessageCard
          title="Sin Pagos Registrados"
          description="Aún no se han registrado pagos en este turno."
          type="info"
        />
      )}
    </div>
  )
}
