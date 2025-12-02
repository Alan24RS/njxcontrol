import type { RecaudacionRow } from '@/services/analytics/recaudacion/types'

/**
 * Exporta datos de recaudación a CSV
 */
export function exportRecaudacionToExcel(
  data: RecaudacionRow[],
  filename: string = 'recaudacion.csv'
) {
  // Transformar datos para CSV
  const csvData = data.map((row) => ({
    Mes: new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long'
    }).format(new Date(row.mes)),
    Playa: row.playa_nombre,
    'Total Pagos': row.total_pagos,
    'Recaudación Mensual': row.recaudacion_mensual.toFixed(2),
    'Ticket Promedio': row.ticket_promedio.toFixed(2)
  }))

  // Generar CSV
  const headers = Object.keys(csvData[0] || {})
  const csvContent = [
    headers.join(','),
    ...csvData.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof typeof row]
          // Escapar valores con comas o comillas
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(',')
    )
  ].join('\n')

  // Descargar archivo CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
