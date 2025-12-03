'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  CurrencyInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@/components/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { iniciarTurno } from '@/services/turnos'
import { useSelectedPlaya } from '@/stores'

type IniciarTurnoFormData = {
  efectivoInicial: number
}

// Helper para parsear horarios de playa (formato: "LUN,MAR 08:00-20:00 | MIE-DOM 06:00-22:00")
function parseHorarioPlaya(horario: string): Array<{
  dias: string[]
  apertura: string
  cierre: string
}> {
  const schedules: Array<{ dias: string[]; apertura: string; cierre: string }> =
    []
  const segments = horario.split('|').map((s) => s.trim())

  for (const seg of segments) {
    const match = seg.match(
      /((?:LUN|MAR|MI[ÉE]|JUE|VIE|S[ÁA]B|DOM)(?:,(?:LUN|MAR|MI[ÉE]|JUE|VIE|S[ÁA]B|DOM))*)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/i
    )
    if (match) {
      const diasStr = match[1]
      const apertura = match[2]
      const cierre = match[3]
      const dias = diasStr.split(',').map((d) => d.trim().toUpperCase())
      schedules.push({ dias, apertura, cierre })
    }
  }

  return schedules
}

function getDayKey(date: Date): string {
  const days = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
  return days[date.getDay()]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTimeDifference(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}min`
  }
}

function checkScheduleCompliance(
  horario: string,
  now: Date
): { hasWarning: boolean; message: string } {
  const schedules = parseHorarioPlaya(horario)
  if (schedules.length === 0) {
    // No se pudo parsear, sin advertencia
    return { hasWarning: false, message: '' }
  }

  const dayKey = getDayKey(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Buscar si hay un horario para el día actual
  const todaySchedules = schedules.filter((s) => s.dias.includes(dayKey))
  if (todaySchedules.length === 0) {
    return {
      hasWarning: true,
      message: `Hoy (${dayKey}) no está en el horario de actividad de la playa. Iniciar el turno fuera del horario establecido puede generar inconsistencias en tu historial de uso.`
    }
  }

  // Verificar si está dentro de algún horario del día
  let closestBefore: {
    schedule: (typeof todaySchedules)[0]
    diff: number
  } | null = null
  let closestAfter: {
    schedule: (typeof todaySchedules)[0]
    diff: number
  } | null = null
  let isWithinSchedule = false

  for (const schedule of todaySchedules) {
    const aperturaMin = timeToMinutes(schedule.apertura)
    const cierreMin = timeToMinutes(schedule.cierre)

    // Dentro del horario
    if (currentMinutes >= aperturaMin && currentMinutes <= cierreMin) {
      isWithinSchedule = true
      break
    }

    // Antes de apertura
    if (currentMinutes < aperturaMin) {
      const diff = aperturaMin - currentMinutes
      if (!closestBefore || diff < closestBefore.diff) {
        closestBefore = { schedule, diff }
      }
    }

    // Después de cierre
    if (currentMinutes > cierreMin) {
      const diff = currentMinutes - cierreMin
      if (!closestAfter || diff < closestAfter.diff) {
        closestAfter = { schedule, diff }
      }
    }
  }

  // Si está dentro del horario, sin advertencia
  if (isWithinSchedule) {
    return { hasWarning: false, message: '' }
  }

  // Antes de la apertura
  if (closestBefore) {
    const timeLeft = formatTimeDifference(closestBefore.diff)
    return {
      hasWarning: true,
      message: `Estás iniciando el turno antes del horario de apertura (${closestBefore.schedule.apertura}). Faltan ${timeLeft} para la apertura. Esto puede generar inconsistencias en tu historial de uso.`
    }
  }

  // Después del cierre
  if (closestAfter) {
    const timeExceeded = formatTimeDifference(closestAfter.diff)
    return {
      hasWarning: true,
      message: `Estás iniciando el turno después del horario de cierre (${closestAfter.schedule.cierre}). Han pasado ${timeExceeded} desde el cierre. Esto puede generar inconsistencias en tu historial de uso.`
    }
  }

  // Caso general fuera de horario
  const horasTxt = todaySchedules
    .map((s) => s.apertura + '-' + s.cierre)
    .join(', ')
  return {
    hasWarning: true,
    message: `El horario de la playa para hoy es ${horasTxt}. Estás iniciando el turno fuera del horario establecido, lo cual puede generar inconsistencias en tu historial de uso.`
  }
}

export default function IniciarTurnoForm() {
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { selectedPlaya, isLoading } = useSelectedPlaya()
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<IniciarTurnoFormData>({
    defaultValues: {
      efectivoInicial: 0
    }
  })

  const { control, handleSubmit } = form

  const onSubmit = async (data: IniciarTurnoFormData) => {
    if (!selectedPlaya) {
      toast.error('Debes seleccionar una playa')
      return
    }

    setLoading(true)
    try {
      const result = await iniciarTurno({
        playaId: selectedPlaya.id,
        efectivoInicial: data.efectivoInicial
      })

      if (result.error) {
        toast.error('No se pudo iniciar el turno', {
          description: result.error
        })
      } else {
        toast.success('¡Turno iniciado correctamente!')
        queryClient.invalidateQueries({ queryKey: ['turno-activo'] })
        router.push('/admin/turnos')
      }
    } catch (err) {
      console.error(err)
      toast.error('Hubo un problema al iniciar el turno.')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !selectedPlaya) {
    return (
      <div className="flex w-full grow flex-col items-center justify-center space-y-4 p-8">
        <Spinner />
      </div>
    )
  }

  // Verificar horario al cargar el componente
  const scheduleCheck = checkScheduleCompliance(
    selectedPlaya.horario || '',
    new Date()
  )

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormItem>
          <FormLabel>Playa</FormLabel>
          <FormControl>
            <Input
              name="playa-display"
              value={selectedPlaya.nombre || selectedPlaya.direccion}
              disabled
              className="bg-muted"
            />
          </FormControl>
          <p className="text-muted-foreground text-sm">
            La playa se selecciona desde el panel lateral
          </p>
        </FormItem>

        {scheduleCheck.hasWarning && (
          <Alert
            variant="default"
            className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
          >
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300">
              Advertencia de horario
            </AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              {scheduleCheck.message}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={control}
          name="efectivoInicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Efectivo inicial</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="$ 0,00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/turnos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} loading={loading}>
            Iniciar turno
          </Button>
        </div>
      </form>
    </Form>
  )
}
