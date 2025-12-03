'use client'

import { useEffect, useState } from 'react'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner
} from '@/components/ui'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { AbonoDetalles } from '@/services/abonos'

interface AbonoTabProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export default function AbonoTab({
  playaId,
  plazaId,
  fechaHoraInicio
}: AbonoTabProps) {
  const [abono, setAbono] = useState<AbonoDetalles | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAbono = async () => {
      try {
        const { getAbonoByIdAction } = await import(
          '@/app/admin/abonos/queries'
        )
        const result = await getAbonoByIdAction(
          playaId,
          plazaId,
          fechaHoraInicio
        )

        if (!result.error && result.data) {
          setAbono(result.data)
        }
      } catch (error) {
        console.error('Error fetching abono:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAbono()
  }, [playaId, plazaId, fechaHoraInicio])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!abono) {
    return (
      <div className="text-muted-foreground text-center">
        No se encontró información del abono
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Abono</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Playa</p>
              <p className="text-sm font-semibold">{abono.playaNombre}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Plaza</p>
              <p className="text-sm font-semibold">
                {abono.plazaIdentificador} ({abono.tipoPlazaNombre})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de Inicio
              </p>
              <p className="text-sm">{formatDate(abono.fechaHoraInicio)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Estado
              </p>
              <Badge
                className={
                  abono.estado === 'ACTIVO'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }
              >
                {abono.estado}
              </Badge>
            </div>
          </div>

          {abono.fechaFin && (
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de Finalización
              </p>
              <p className="text-sm">{formatDate(abono.fechaFin)}</p>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
            <p className="text-muted-foreground text-sm font-medium">
              Precio Mensual
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(abono.precioMensual)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehículos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {abono.vehiculos.map((vehiculo) => (
              <div
                key={vehiculo.patente}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-semibold">{vehiculo.patente}</p>
                  <p className="text-muted-foreground text-sm">
                    {TIPO_VEHICULO_LABEL[vehiculo.tipoVehiculo]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
