'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import { getRecaudacionTurno } from '@/services/turnos/getRecaudacionTurno'
import { type Turno } from '@/services/turnos/types'
import { formatCurrency } from '@/utils/formatters'

interface RecaudacionTurnoProps {
  turno: Turno | null
}

export function RecaudacionTurno({ turno }: RecaudacionTurnoProps) {
  const [recaudacion, setRecaudacion] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!turno) {
      setIsLoading(false)
      setRecaudacion(null)
      return
    }

    const fetchRecaudacion = async () => {
      setIsLoading(true)
      setError(null)

      const { data: recaudacionData, error: recaudacionError } =
        await getRecaudacionTurno(
          turno.playaId,
          turno.fechaHoraIngreso.toISOString()
        )

      if (recaudacionError) {
        setError('No se pudo obtener la recaudación del turno.')
        setRecaudacion(null)
      } else {
        setRecaudacion(recaudacionData)
      }

      setIsLoading(false)
    }

    fetchRecaudacion()
  }, [turno])

  if (isLoading) {
    return <div>Cargando...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (recaudacion === null) {
    return <div>no se encontro recaudacion</div>
  }
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button className="text-blue-900" variant="link">
          Recaudacion
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <h3 className="text-lg font-bold text-blue-900">Recaudación</h3>
        <p className="font-light text-gray-700">
          Volumen de dinero recaudado desde el inicio del turno actual.
        </p>
        <p className="text-2xl font-bold text-blue-600">
          {formatCurrency(recaudacion)}
        </p>
      </HoverCardContent>
    </HoverCard>
  )
}
