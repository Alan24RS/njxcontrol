'use client'

import { useEffect, useState } from 'react'

import { Mail, Phone, User } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner
} from '@/components/ui'

interface AbonadoData {
  abonadoId: number
  nombre: string
  apellido: string
  dni: string
  email: string | null
  telefono: string | null
  fechaAlta: Date
}

interface AbonadoTabProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export default function AbonadoTab({
  playaId,
  plazaId,
  fechaHoraInicio
}: AbonadoTabProps) {
  const [abonado, setAbonado] = useState<AbonadoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAbonado = async () => {
      try {
        const { getAbonoByIdAction } = await import(
          '@/app/admin/abonos/queries'
        )
        const result = await getAbonoByIdAction(
          playaId,
          plazaId,
          fechaHoraInicio
        )

        if (!result.error && result.data) {
          setAbonado({
            abonadoId: result.data.abonadoId,
            nombre: result.data.abonadoNombre,
            apellido: result.data.abonadoApellido,
            dni: result.data.abonadoDni,
            email: result.data.abonadoEmail,
            telefono: result.data.abonadoTelefono,
            fechaAlta: result.data.abonadoFechaAlta
          })
        }
      } catch (error) {
        console.error('Error fetching abonado:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAbonado()
  }, [playaId, plazaId, fechaHoraInicio])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!abonado) {
    return (
      <div className="text-muted-foreground text-center">
        No se encontró información del abonado
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 flex items-center gap-3 rounded-lg p-4">
            <User className="text-muted-foreground h-10 w-10" />
            <div>
              <p className="text-xl font-bold">
                {abonado.nombre} {abonado.apellido}
              </p>
              <p className="text-muted-foreground text-sm">
                ID: {abonado.abonadoId}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">DNI</p>
              <p className="text-lg font-semibold">{abonado.dni}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Fecha de Alta
              </p>
              <p className="text-sm">{formatDate(abonado.fechaAlta)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {abonado.email ? (
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Email
                </p>
                <a
                  href={`mailto:${abonado.email}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {abonado.email}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Mail className="text-muted-foreground h-5 w-5" />
              <p className="text-muted-foreground text-sm">
                Sin email registrado
              </p>
            </div>
          )}

          {abonado.telefono ? (
            <div className="flex items-center gap-3">
              <Phone className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Teléfono
                </p>
                <a
                  href={`tel:${abonado.telefono}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {abonado.telefono}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Phone className="text-muted-foreground h-5 w-5" />
              <p className="text-muted-foreground text-sm">
                Sin teléfono registrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
