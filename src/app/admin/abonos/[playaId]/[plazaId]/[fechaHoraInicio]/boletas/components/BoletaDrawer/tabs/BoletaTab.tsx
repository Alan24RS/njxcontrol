'use client'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui'
import type { Boleta } from '@/services/abonos/types'

interface BoletaTabProps {
  boleta: Boleta
}

const estadoColors = {
  PENDIENTE:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  PAGADA:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  VENCIDA: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
}

export default function BoletaTab({ boleta }: BoletaTabProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const saldoPendiente = boleta.monto - boleta.montoPagado

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                ID Boleta
              </p>
              <p className="font-mono text-sm">{boleta.boletaId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Estado
              </p>
              <Badge className={estadoColors[boleta.estado]}>
                {boleta.estado}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de Generación
              </p>
              <p className="text-sm">{formatDate(boleta.fechaGeneracion)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de Vencimiento
              </p>
              <p className="text-sm">{formatDate(boleta.fechaVencimiento)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Montos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Monto Total
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(boleta.monto)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Monto Pagado
              </p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(boleta.montoPagado)}
              </p>
            </div>
          </div>

          {saldoPendiente > 0 && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
              <p className="text-muted-foreground text-sm font-medium">
                Saldo Pendiente
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(saldoPendiente)}
              </p>
            </div>
          )}

          {saldoPendiente === 0 && boleta.estado === 'PAGADA' && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
              <p className="text-center text-sm font-semibold text-green-700 dark:text-green-400">
                ✓ Boleta totalmente pagada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
