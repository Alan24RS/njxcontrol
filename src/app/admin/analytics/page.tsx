import { Metadata } from 'next'
import Link from 'next/link'

import { BarChart3, TrendingUp, Users } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Analytics | Panel de Administración',
  description: 'Dashboard de analytics y reportes de recaudación'
}

const analyticsReports = [
  {
    title: 'Recaudación',
    description: 'Análisis de ingresos mensuales agrupados por ubicación',
    icon: BarChart3,
    href: '/admin/analytics/recaudacion-por-playa',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    title: 'Proyección de Recaudación',
    description: 'Estimación de ingresos futuros basada en abonos activos',
    icon: TrendingUp,
    href: '/admin/analytics/proyeccion-futura',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    comingSoon: true
  },
  {
    title: 'Performance de Playeros',
    description: 'Recaudación generada por cada playero',
    icon: Users,
    href: '/admin/analytics/recaudacion-por-playero',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    comingSoon: true
  }
]

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-white to-slate-50 p-8 dark:from-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,var(--color-blue-100),transparent_60%),radial-gradient(circle_at_80%_30%,var(--color-purple-100),transparent_55%),radial-gradient(circle_at_30%_80%,var(--color-orange-100),transparent_55%)] dark:opacity-30" />
        <div className="relative space-y-4">
          <h1 className="bg-linear-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Centro de Analytics
          </h1>
          {/* Sección Informativa */}
          <div className="rounded-lg border bg-white p-6 dark:bg-slate-900">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">
                ¿Qué es el área de Analytics?
              </h2>
              <p className="text-muted-foreground text-sm">
                El módulo de Analytics centraliza información clave sobre el
                rendimiento económico y operativo de las playas. Aquí puedes
                explorar reportes que te ayudan a entender el flujo de ingresos,
                anticipar tendencias y detectar oportunidades de optimización.
              </p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyticsReports.map((report) => {
                  const Icon = report.icon

                  if (report.comingSoon) {
                    return (
                      <Card key={report.title} className="relative opacity-60">
                        <div className="absolute top-2 right-2 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                          Próximamente
                        </div>
                        <CardHeader>
                          <div
                            className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}
                          >
                            <Icon className={`h-6 w-6 ${report.color}`} />
                          </div>
                          <CardTitle>{report.title}</CardTitle>
                          <CardDescription>
                            {report.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )
                  }

                  return (
                    <Link key={report.title} href={report.href}>
                      <Card className="hover:border-primary transition-all hover:shadow-md">
                        <CardHeader>
                          <div
                            className={`mb-2 flex h-12 w-12 items-center justify-center rounded-lg ${report.bgColor}`}
                          >
                            <Icon className={`h-6 w-6 ${report.color}`} />
                          </div>
                          <CardTitle>{report.title}</CardTitle>
                          <CardDescription>
                            {report.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-primary text-sm font-medium">
                            Ver reporte →
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Casos de Uso Frecuentes
                </h3>
                <ul className="text-muted-foreground grid gap-2 text-xs md:grid-cols-2">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Detectar caídas
                    repentinas de ingresos en una playa.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Comparar evolución
                    mensual y validar impacto de campañas.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Identificar playas
                    con mayor potencial de crecimiento.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Preparar informes
                    ejecutivos de resultados acumulados.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Priorizar acciones
                    operativas según tendencia de ingresos.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span> Revisar consistencia
                    entre recaudación y abonos activos.
                  </li>
                </ul>
              </div>
              <div className="rounded-md bg-linear-to-r from-blue-50 via-purple-50 to-orange-50 p-4 text-xs dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                <p className="text-muted-foreground">
                  Este espacio seguirá expandiéndose con visualizaciones
                  avanzadas, alertas inteligentes y segmentaciones
                  personalizadas para mejorar tu capacidad de reacción y
                  planificación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
