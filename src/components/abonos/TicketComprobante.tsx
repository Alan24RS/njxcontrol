'use client'

import { useRef } from 'react'

import type { Boleta } from '@/services/abonos/types'

interface TicketComprobanteProps {
  boleta: Boleta
  playaNombre?: string
  plazaIdentificador?: string
}

export default function TicketComprobante({
  boleta,
  playaNombre = 'Estacionamiento',
  plazaIdentificador
}: TicketComprobanteProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getEstadoClass = () => {
    switch (boleta.estado) {
      case 'PAGADA':
        return 'pagada'
      case 'PENDIENTE':
        return 'pendiente'
      case 'VENCIDA':
        return 'vencida'
      default:
        return 'pendiente'
    }
  }

  const getEstadoText = () => {
    switch (boleta.estado) {
      case 'PAGADA':
        return 'PAGADA'
      case 'PENDIENTE':
        return 'PENDIENTE DE PAGO'
      case 'VENCIDA':
        return 'VENCIDA'
      default:
        return 'PENDIENTE'
    }
  }

  const isValidoComoFactura = boleta.estado === 'PAGADA'

  return (
    <div
      ref={printRef}
      id="ticket-comprobante"
      className="ticket-print-container"
    >
      <div className="ticket mx-auto max-w-[300px] border border-dashed border-gray-400 bg-white p-4 font-mono text-sm text-black">
        <div className="header mb-2 border-b border-dashed border-gray-400 pb-2 text-center text-black">
          <h1 className="text-base font-bold text-black">{playaNombre}</h1>
          <p className="mt-1 text-xs text-black">Estacionamiento</p>
          {plazaIdentificador && (
            <p className="mt-1 text-xs text-black">
              Plaza: {plazaIdentificador}
            </p>
          )}
        </div>

        <div className="section space-y-1 border-b border-dashed border-gray-300 py-2 text-black">
          <div className="row flex justify-between">
            <span className="label font-bold text-black">Cliente:</span>
            <span className="value text-right text-black">
              {boleta.abonadoNombre || 'N/A'}
            </span>
          </div>
          {boleta.abonadoTelefono && (
            <div className="row flex justify-between">
              <span className="label text-black">Teléfono:</span>
              <span className="value text-right text-black">
                {boleta.abonadoTelefono}
              </span>
            </div>
          )}
        </div>

        <div className="section space-y-1 border-b border-dashed border-gray-300 py-2 text-black">
          <div className="row flex justify-between">
            <span className="label font-bold text-black">Concepto:</span>
            <span className="value text-right text-black">Abono Mensual</span>
          </div>
          <div className="row flex justify-between">
            <span className="label text-black">Período:</span>
            <span className="value text-right text-black">
              {boleta.fechaVencimiento.toLocaleDateString('es-AR', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>

        <div className="section space-y-1 border-b border-dashed border-gray-300 py-2 text-black">
          <div className="row flex justify-between">
            <span className="label text-black">Fecha Generación:</span>
            <span className="value text-right text-black">
              {formatDateShort(boleta.fechaGeneracion)}
            </span>
          </div>
          <div className="row flex justify-between">
            <span className="label text-black">Fecha Vencimiento:</span>
            <span className="value text-right text-black">
              {formatDateShort(boleta.fechaVencimiento)}
            </span>
          </div>
          {boleta.estado === 'PAGADA' && (
            <div className="row flex justify-between">
              <span className="label text-black">Fecha de Pago:</span>
              <span className="value text-right text-black">
                {formatDateShort(boleta.fechaGeneracion)}
              </span>
            </div>
          )}
        </div>

        <div className="section space-y-1 border-b border-dashed border-gray-300 py-2 text-black">
          <div className="row flex justify-between">
            <span className="label text-black">Monto Total:</span>
            <span className="value text-right font-bold text-black">
              ${boleta.monto.toLocaleString('es-AR')}
            </span>
          </div>
          {boleta.montoPagado > 0 && (
            <div className="row flex justify-between">
              <span className="label text-black">Monto Pagado:</span>
              <span className="value text-right text-black">
                ${boleta.montoPagado.toLocaleString('es-AR')}
              </span>
            </div>
          )}
          {boleta.deudaPendiente > 0 && (
            <div className="row flex justify-between">
              <span className="label text-black">Deuda Pendiente:</span>
              <span className="value text-right font-bold text-black">
                ${boleta.deudaPendiente.toLocaleString('es-AR')}
              </span>
            </div>
          )}
        </div>

        <div
          className={`status ${getEstadoClass()} my-2 rounded py-2 text-center text-sm font-bold ${
            boleta.estado === 'PAGADA'
              ? 'border-2 border-green-800 bg-green-100 text-black print:text-black'
              : boleta.estado === 'VENCIDA'
                ? 'border-2 border-red-800 bg-red-100 text-black print:text-black'
                : 'border-2 border-yellow-800 bg-yellow-100 text-black print:text-black'
          }`}
        >
          {getEstadoText()}
        </div>

        {!isValidoComoFactura && (
          <div className="warning my-2 border-2 border-dashed border-yellow-600 bg-yellow-50 p-2 text-center text-xs font-bold text-black print:text-black">
            COMPROBANTE NO VÁLIDO COMO FACTURA
            <br />
            PENDIENTE DE PAGO
          </div>
        )}

        {isValidoComoFactura && (
          <div className="footer mt-4 border-t border-dashed border-gray-400 pt-2 text-center text-xs text-black">
            <p className="font-bold text-black">Gracias por su visita</p>
            <p className="mt-1 text-black">Comprobante válido como factura</p>
          </div>
        )}

        <div className="footer mt-4 border-t border-dashed border-gray-400 pt-2 text-center text-xs text-black">
          <p className="text-black">{formatDate(new Date())}</p>
        </div>
      </div>
    </div>
  )
}
