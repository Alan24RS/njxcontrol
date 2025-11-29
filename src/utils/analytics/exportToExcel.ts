import * as XLSX from 'xlsx'

import type { RecaudacionRow } from '@/services/analytics/recaudacion/types'

/**
 * Exporta datos de recaudación a Excel
 */
export function exportRecaudacionToExcel(
  data: RecaudacionRow[],
  filename: string = 'recaudacion.xlsx'
) {
  // Transformar datos para Excel
  const excelData = data.map((row) => ({
    Mes: new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(row.mes)),
    Playa: row.playa_nombre,
    'Total Pagos': row.total_pagos,
    'Recaudación Mensual': row.recaudacion_mensual,
    'Ticket Promedio': row.ticket_promedio
  }))

  // Crear workbook
  const ws = XLSX.utils.json_to_sheet(excelData)

  // Formatear columnas de moneda
  const range = XLSX.utils.decode_range(ws['!ref']!)
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    const recaudacionCell = XLSX.utils.encode_cell({ r: R, c: 3 })
    const ticketCell = XLSX.utils.encode_cell({ r: R, c: 4 })

    if (ws[recaudacionCell]) {
      ws[recaudacionCell].z = '"$"#,##0.00'
    }
    if (ws[ticketCell]) {
      ws[ticketCell].z = '"$"#,##0.00'
    }
  }

  // Ajustar anchos de columna
  ws['!cols'] = [
    { wch: 15 }, // Mes
    { wch: 20 }, // Playa
    { wch: 15 }, // Total Pagos
    { wch: 20 }, // Recaudación
    { wch: 18 } // Ticket Promedio
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Recaudación por Playa')

  // Descargar archivo
  XLSX.writeFile(wb, filename)
}
