'use client'

import { useEffect, useState } from 'react'

import { Calendar, Clock } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui'

function getNextBillingDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

function getTimeUntilNextBilling(): {
  days: number
  hours: number
  minutes: number
  seconds: number
} {
  const now = new Date()
  const nextBilling = getNextBillingDate()
  const diff = nextBilling.getTime() - now.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

export function NextBillingInfo() {
  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilNextBilling())
  const nextBilling = getNextBillingDate()

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilNextBilling())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <AlertDescription>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Próxima emisión de boletas mensuales
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {nextBilling.toLocaleDateString('es-AR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}{' '}
              a las 00:05 hs
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 dark:bg-gray-900">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <div className="flex items-baseline gap-2 font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
              <div className="flex flex-col items-center">
                <span className="text-2xl" suppressHydrationWarning>
                  {timeRemaining.days}
                </span>
                <span className="text-xs text-gray-500">días</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl" suppressHydrationWarning>
                  {String(timeRemaining.hours).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-500">hs</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl" suppressHydrationWarning>
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-500">min</span>
              </div>
              <span className="text-gray-400">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl" suppressHydrationWarning>
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-500">seg</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Todas las boletas mensuales de abonos activos se generarán
          automáticamente el día 1 de cada mes con vencimiento a 15 días. El
          estado de las boletas del mes anterior se actualizará a{' '}
          <span className="font-semibold text-red-600 dark:text-red-400">
            VENCIDA
          </span>{' '}
          si quedaron pendientes.
        </p>
      </AlertDescription>
    </Alert>
  )
}
