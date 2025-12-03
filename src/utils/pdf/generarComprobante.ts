import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ComprobanteData {
  boleta: {
    monto: number
    montoPagado: number
    fechaGeneracion: Date
    fechaVencimiento: Date
    estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA'
  }
  abonado: {
    nombre: string
    apellido: string
    dni?: string
    telefono?: string | null
    email?: string | null
  }
  servicio: {
    playaNombre: string
    plazaIdentificador: string
    tipoPlazaNombre?: string
    vehiculo: {
      patente: string
      tipoVehiculo: string
    }
    periodo: string
  }
  pago: {
    fechaPago: Date
    metodoPago: string
    montoPagado: number
  }
}

export function generarComprobantePDF(data: ComprobanteData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPosition = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, yPosition, {
    align: 'center'
  })

  yPosition += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(data.servicio.playaNombre, pageWidth / 2, yPosition, {
    align: 'center'
  })

  yPosition += 5

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const fechaEmision = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth / 2, yPosition, {
    align: 'center'
  })

  doc.setTextColor(0, 0, 0)
  yPosition += 15

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL CLIENTE', margin, yPosition)
  yPosition += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const clienteData = [
    ['Nombre Completo:', `${data.abonado.nombre} ${data.abonado.apellido}`],
    ['DNI:', data.abonado.dni || 'N/A'],
    ['Teléfono:', data.abonado.telefono || 'N/A'],
    ['Email:', data.abonado.email || 'N/A']
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: clienteData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 }
    },
    margin: { left: margin, right: margin }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 10

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL SERVICIO', margin, yPosition)
  yPosition += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const servicioData = [
    ['Plaza asignada:', data.servicio.plazaIdentificador],
    ['Tipo de plaza:', data.servicio.tipoPlazaNombre || 'N/A'],
    ['Vehículo:', `${data.servicio.vehiculo.patente}`],
    ['Tipo de vehículo:', data.servicio.vehiculo.tipoVehiculo],
    ['Período abonado:', data.servicio.periodo]
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: servicioData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 }
    },
    margin: { left: margin, right: margin }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 10

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DEL PAGO', margin, yPosition)
  yPosition += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  const fechaPago = data.pago.fechaPago.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const pagoData = [
    ['Monto total:', `$${data.boleta.monto.toLocaleString('es-AR')}`],
    ['Monto pagado:', `$${data.pago.montoPagado.toLocaleString('es-AR')}`],
    ['Fecha de pago:', fechaPago],
    ['Estado:', data.boleta.estado],
    ['Método de pago:', data.pago.metodoPago]
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: pagoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 }
    },
    margin: { left: margin, right: margin }
  })

  yPosition = (doc as any).lastAutoTable.finalY + 15

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text('Gracias por su confianza', pageWidth / 2, yPosition, {
    align: 'center'
  })

  const fileName = `Comprobante_${data.abonado.apellido}_${data.boleta.fechaGeneracion.toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
