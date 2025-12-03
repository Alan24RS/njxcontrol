'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  DollarSign,
  Download,
  FileText,
  MessageCircle,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'

import { getAbonoByIdAction } from '@/app/admin/abonos/queries'
import TicketComprobante from '@/components/abonos/TicketComprobante'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { generarComprobantePDF } from '@/utils/pdf/generarComprobante'

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
  const [boletaComprobante, setBoletaComprobante] = useState<Boleta | null>(
    null
  )

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

  const getEstadoBadge = (boleta: Boleta) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaVencimiento = new Date(boleta.fechaVencimiento)
    fechaVencimiento.setHours(0, 0, 0, 0)
    const estaVencida = fechaVencimiento < hoy && boleta.estado === 'PENDIENTE'

    if (estaVencida) {
      return <Badge variant="destructive">VENCIDA</Badge>
    }

    switch (boleta.estado) {
      case 'PAGADA':
        return <Badge variant="default">Pagada</Badge>
      case 'VENCIDA':
        return <Badge variant="destructive">Vencida</Badge>
      case 'PENDIENTE':
        return <Badge variant="secondary">Pendiente</Badge>
    }
  }

  const handleWhatsApp = (boleta: Boleta) => {
    if (!boleta.abonadoTelefono) {
      return
    }

    const mes = boleta.fechaVencimiento.toLocaleDateString('es-AR', {
      month: 'long'
    })
    const fechaVencimiento = formatDate(boleta.fechaVencimiento)
    const nombre = boleta.abonadoNombre || 'Cliente'
    const mensaje = `Hola ${nombre}, le recordamos que su boleta del mes de ${mes} vence el ${fechaVencimiento}. Monto: $${boleta.monto.toLocaleString()}. Por favor regularizar su pago.`
    const telefono = boleta.abonadoTelefono.replace(/\D/g, '')
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  const handleVerComprobante = (boleta: Boleta) => {
    setBoletaComprobante(boleta)
  }

  const handleDownloadPDF = async (boleta: Boleta) => {
    try {
      const abonoResult = await getAbonoByIdAction(
        playaId,
        plazaId,
        fechaHoraInicio
      )

      if (!abonoResult.data) {
        toast.error('Error', {
          description: 'No se pudo obtener la información del abono'
        })
        return
      }

      const abonoData = abonoResult.data
      const vehiculo = abonoData.vehiculos?.[0] || {
        patente: 'N/A',
        tipoVehiculo: 'N/A'
      }

      const periodo = boleta.fechaVencimiento.toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric'
      })

      generarComprobantePDF({
        boleta: {
          monto: boleta.monto,
          montoPagado: boleta.montoPagado,
          fechaGeneracion: boleta.fechaGeneracion,
          fechaVencimiento: boleta.fechaVencimiento,
          estado: boleta.estado
        },
        abonado: {
          nombre: abonoData.abonadoNombre,
          apellido: abonoData.abonadoApellido,
          dni: abonoData.abonadoDni,
          telefono: boleta.abonadoTelefono,
          email: null
        },
        servicio: {
          playaNombre: 'Estacionamiento',
          plazaIdentificador: abonoData.plazaIdentificador,
          tipoPlazaNombre: abonoData.tipoPlazaNombre,
          vehiculo: {
            patente: vehiculo.patente,
            tipoVehiculo: vehiculo.tipoVehiculo
          },
          periodo
        },
        pago: {
          fechaPago: boleta.fechaGeneracion,
          metodoPago: 'PAGO REGISTRADO',
          montoPagado: boleta.montoPagado
        }
      })
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error', {
        description: 'No se pudo generar el comprobante PDF'
      })
    }
  }

  const handlePrint = () => {
    if (boletaComprobante) {
      const printWindow = window.open('', '_blank')
      if (printWindow && boletaComprobante) {
        const ticketContent = document.querySelector(
          '#ticket-comprobante'
        )?.innerHTML
        if (ticketContent) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Comprobante de Pago</title>
                <style>
                  @media print {
                    @page {
                      size: 80mm auto;
                      margin: 0;
                    }
                    body {
                      margin: 0;
                      padding: 10px;
                      font-family: 'Courier New', monospace;
                      font-size: 12px;
                      color: #000 !important;
                    }
                    * {
                      color: #000 !important;
                    }
                  }
                  body {
                    margin: 0;
                    padding: 10px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    max-width: 300px;
                    margin: 0 auto;
                    color: #000;
                  }
                  * {
                    color: #000 !important;
                  }
                  .ticket {
                    border: 1px dashed #000;
                    padding: 15px;
                    background: white;
                    color: #000 !important;
                  }
                  .header {
                    text-align: center;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                    color: #000 !important;
                  }
                  .header h1 {
                    font-size: 16px;
                    margin: 0;
                    font-weight: bold;
                    color: #000 !important;
                  }
                  .header p {
                    font-size: 10px;
                    margin: 5px 0 0 0;
                    color: #000 !important;
                  }
                  .section {
                    margin: 10px 0;
                    padding: 5px 0;
                    border-bottom: 1px dashed #ccc;
                    color: #000 !important;
                  }
                  .section:last-child {
                    border-bottom: none;
                  }
                  .row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                    color: #000 !important;
                  }
                  .label {
                    font-weight: bold;
                    color: #000 !important;
                  }
                  .value {
                    text-align: right;
                    color: #000 !important;
                  }
                  .status {
                    text-align: center;
                    padding: 10px;
                    margin: 10px 0;
                    font-weight: bold;
                    font-size: 14px;
                    color: #000 !important;
                  }
                  .status.pagada {
                    background: #d4edda;
                    color: #000 !important;
                    border: 2px solid #155724;
                  }
                  .status.pendiente {
                    background: #fff3cd;
                    color: #000 !important;
                    border: 2px solid #856404;
                  }
                  .status.vencida {
                    background: #f8d7da;
                    color: #000 !important;
                    border: 2px solid #721c24;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 15px;
                    padding-top: 10px;
                    border-top: 1px dashed #000;
                    font-size: 10px;
                    color: #000 !important;
                  }
                  .warning {
                    background: #fff3cd;
                    border: 2px dashed #856404;
                    padding: 10px;
                    margin: 10px 0;
                    text-align: center;
                    font-weight: bold;
                    font-size: 11px;
                    color: #000 !important;
                  }
                  span, p, div, h1, h2, h3 {
                    color: #000 !important;
                  }
                </style>
              </head>
              <body>
                ${ticketContent}
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.focus()
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 250)
        }
      }
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
              <TableRow key={`${boleta.fechaGeneracion.toISOString()}`}>
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
                <TableCell>{getEstadoBadge(boleta)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerComprobante(boleta)}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      {boleta.estado === 'PAGADA'
                        ? 'Ver Comprobante'
                        : 'Ver Detalle'}
                    </Button>
                    {boleta.abonadoTelefono && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(boleta)}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        WhatsApp
                      </Button>
                    )}
                    {boleta.estado !== 'PAGADA' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBoleta(boleta)}
                      >
                        <DollarSign className="mr-1 h-4 w-4" />
                        Registrar pago
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedBoleta && (
        <RegistrarPagoModal
          boleta={selectedBoleta}
          isOpen={true}
          onClose={() => setSelectedBoleta(null)}
          onSuccess={() => {
            setSelectedBoleta(null)
            fetchBoletas()
          }}
        />
      )}

      {boletaComprobante && (
        <Dialog
          open={!!boletaComprobante}
          onOpenChange={(open) => {
            if (!open) {
              setBoletaComprobante(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {boletaComprobante.estado === 'PAGADA'
                  ? 'Comprobante de Pago'
                  : 'Detalle de Boleta'}
              </DialogTitle>
              <DialogDescription>
                {boletaComprobante.estado === 'PAGADA'
                  ? 'Comprobante válido como factura'
                  : 'Detalle de la boleta pendiente de pago'}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[600px] overflow-y-auto">
              <TicketComprobante
                boleta={boletaComprobante}
                playaNombre="Estacionamiento"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBoletaComprobante(null)}
              >
                Cerrar
              </Button>
              {boletaComprobante.estado === 'PAGADA' && (
                <Button
                  onClick={() => handleDownloadPDF(boletaComprobante)}
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
              )}
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
