'use client'

import { useCallback, useEffect, useState } from 'react'

import { DollarSign } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type { Boleta } from '@/services/abonos/types'

import BoletaDrawer from './BoletaDrawer'
import RegistrarPagoModal from './RegistrarPagoModal'

interface BoletasTableProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export default function BoletasTable({
  playaId,
  plazaId,
  fechaHoraInicio
}: BoletasTableProps) {
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBoleta, setSelectedBoleta] = useState<Boleta | null>(null)
  const [showRegistrarPago, setShowRegistrarPago] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchBoletas = useCallback(async () => {
    setLoading(true)
    try {
      const { getBoletasByAbonoAction } = await import(
        '@/app/admin/abonos/queries'
      )
      const result = await getBoletasByAbonoAction(
        playaId,
        plazaId,
        fechaHoraInicio
      )

      if (result.error) {
        setError(result.error)
        setBoletas([])
      } else {
        setBoletas(result.data || [])
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar boletas')
      setBoletas([])
    } finally {
      setLoading(false)
    }
  }, [playaId, plazaId, fechaHoraInicio])

  useEffect(() => {
    fetchBoletas()
  }, [fetchBoletas])

  const handleRowClick = (boleta: Boleta) => {
    setSelectedBoleta(boleta)
    setDrawerOpen(true)
  }

  const handleRegistrarPago = (boleta: Boleta, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBoleta(boleta)
    setShowRegistrarPago(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
        <span className="ml-2">Cargando boletas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (boletas.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No hay boletas generadas para este abono
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getEstadoBadge = (estado: Boleta['estado']) => {
    switch (estado) {
      case 'PAGADA':
        return <Badge variant="default">Pagada</Badge>
      case 'VENCIDA':
        return <Badge variant="destructive">Vencida</Badge>
      case 'PENDIENTE':
        return <Badge variant="secondary">Pendiente</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha generación</TableHead>
              <TableHead>Fecha vencimiento</TableHead>
              <TableHead>Monto total</TableHead>
              <TableHead>Monto pagado</TableHead>
              <TableHead>Deuda pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {boletas.map((boleta) => (
              <TableRow
                key={`${boleta.fechaGeneracion.toISOString()}`}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => handleRowClick(boleta)}
              >
                <TableCell>{formatDate(boleta.fechaGeneracion)}</TableCell>
                <TableCell>{formatDate(boleta.fechaVencimiento)}</TableCell>
                <TableCell className="font-semibold">
                  ${boleta.monto.toLocaleString()}
                </TableCell>
                <TableCell>${boleta.montoPagado.toLocaleString()}</TableCell>
                <TableCell
                  className={
                    boleta.deudaPendiente > 0
                      ? 'text-destructive font-semibold'
                      : ''
                  }
                >
                  ${boleta.deudaPendiente.toLocaleString()}
                </TableCell>
                <TableCell>{getEstadoBadge(boleta.estado)}</TableCell>
                <TableCell className="text-right">
                  {boleta.estado !== 'PAGADA' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRegistrarPago(boleta, e)}
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      Registrar pago
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BoletaDrawer
        boleta={selectedBoleta}
        playaId={playaId}
        plazaId={plazaId}
        fechaHoraInicio={fechaHoraInicio}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onPaymentRegistered={fetchBoletas}
      />

      {selectedBoleta && showRegistrarPago && (
        <RegistrarPagoModal
          boleta={selectedBoleta}
          isOpen={showRegistrarPago}
          onClose={() => setShowRegistrarPago(false)}
          onSuccess={() => {
            setShowRegistrarPago(false)
            fetchBoletas()
          }}
        />
      )}
    </div>
  )
}
