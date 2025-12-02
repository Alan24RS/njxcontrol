'use client'

import { Link } from 'next-view-transitions'

import { Calendar, Clock } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export function ReportesPlayaActualContent() {
  const reportes = [
    {
      title: 'Turno Actual',
      description:
        'Visualiza en tiempo real los pagos y estadísticas de tu turno activo',
      icon: Clock,
      href: '/admin/reportes/turno-actual',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Historial de Pagos',
      description:
        'Consulta tus reportes mensuales y el historial de tus turnos anteriores',
      icon: Calendar,
      href: '/admin/reportes/pagos-mensuales',
      color: 'text-green-600 dark:text-green-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {reportes.map((reporte) => {
        const Icon = reporte.icon
        return (
          <Link key={reporte.href} href={reporte.href}>
            <Card className="hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`bg-muted rounded-lg p-3 ${reporte.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2">{reporte.title}</CardTitle>
                    <CardDescription>{reporte.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
