'use client'

import { useEffect, useState } from 'react'

import { DollarSign, FileText, Printer } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner
} from '@/components/ui'
import { METODO_PAGO_LABEL } from '@/constants/metodoPago'
import type { Boleta } from '@/services/abonos/types'

import RegistrarPagoModal from '../../RegistrarPagoModal'

interface Pago {
  pagoId: string
  numeroPago: number
  fechaHoraPago: Date
  montoPago: number
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO'
  playeroNombre: string
  playeroApellido: string
}

interface PagosTabProps {
  boleta: Boleta
  playaId: string
  _plazaId: string
  fechaHoraInicio: string
  onPaymentRegistered?: () => void
}

export default function PagosTab({
  boleta,
  playaId,
  _plazaId,
  fechaHoraInicio,
  onPaymentRegistered
}: PagosTabProps) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegistrarPago, setShowRegistrarPago] = useState(false)

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const { getPagosByBoletaAction } = await import(
          '@/app/admin/abonos/queries'
        )
        const result = await getPagosByBoletaAction(boleta.boletaId)

        if (!result.error && result.data) {
          setPagos(result.data)
        }
      } catch (error) {
        console.error('Error fetching pagos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [boleta.boletaId])

  const handlePaymentSuccess = () => {
    setShowRegistrarPago(false)
    if (onPaymentRegistered) {
      onPaymentRegistered()
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
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

  const saldoPendiente = boleta.monto - boleta.montoPagado
  const tienePagos = pagos.length > 0

  return (
    <div className="space-y-4">
      {/* Resumen de pagos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/10">
              <p className="text-muted-foreground text-xs font-medium">Total</p>
              <p className="text-lg font-bold">
                {formatCurrency(boleta.monto)}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/10">
              <p className="text-muted-foreground text-xs font-medium">
                Pagado
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(boleta.montoPagado)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/10">
              <p className="text-muted-foreground text-xs font-medium">
                Pendiente
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(saldoPendiente)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex gap-2">
        {saldoPendiente > 0 && (
          <Button onClick={() => setShowRegistrarPago(true)} className="flex-1">
            <DollarSign className="mr-2 h-4 w-4" />
            Registrar Pago
          </Button>
        )}
        {tienePagos && (
          <Button variant="outline" className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Recibo
          </Button>
        )}
        {saldoPendiente > 0 && !tienePagos && (
          <Button variant="outline" className="flex-1">
            <FileText className="mr-2 h-4 w-4" />
            Pendiente de Pago
          </Button>
        )}
      </div>

      {/* Lista de pagos */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Spinner className="h-6 w-6" />
        </div>
      ) : tienePagos ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Historial de Pagos ({pagos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagos.map((pago) => (
                <div
                  key={pago.pagoId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Pago #{pago.numeroPago}</p>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                        {METODO_PAGO_LABEL[pago.metodoPago]}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(pago.fechaHoraPago)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Playero: {pago.playeroNombre} {pago.playeroApellido}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(pago.montoPago)}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-1">
                      <Printer className="mr-1 h-3 w-3" />
                      Ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertDescription>
            No hay pagos registrados para esta boleta.
            {saldoPendiente > 0 &&
              ' Registra el primer pago para comenzar el historial.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Modal de registro de pago */}
      <RegistrarPagoModal
        boleta={boleta}
        _playaId={playaId}
        _fechaHoraInicio={fechaHoraInicio}
        open={showRegistrarPago}
        onOpenChange={setShowRegistrarPago}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
