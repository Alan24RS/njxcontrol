'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { Calendar, DollarSign, FileText, MapPin, User } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { AbonoDetalles } from '@/services/abonos'

interface AbonoDetailsProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export default function AbonoDetails({
  playaId,
  plazaId,
  fechaHoraInicio
}: AbonoDetailsProps) {
  const [abono, setAbono] = useState<AbonoDetalles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAbono = async () => {
      try {
        const { getAbonoByIdAction } = await import(
          '@/app/admin/abonos/queries'
        )
        const result = await getAbonoByIdAction(
          playaId,
          plazaId,
          fechaHoraInicio
        )

        if (result.error) {
          setError(result.error)
        } else {
          setAbono(result.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar abono')
      } finally {
        setLoading(false)
      }
    }

    fetchAbono()
  }, [playaId, plazaId, fechaHoraInicio])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-6 w-6" />
        <span className="ml-2">Cargando información del abono...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!abono) {
    return (
      <Alert>
        <AlertDescription>No se encontró el abono</AlertDescription>
      </Alert>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const boletasUrl = `/admin/abonos/${playaId}/${plazaId}/${encodeURIComponent(fechaHoraInicio)}/boletas`

  return (
    <div className="space-y-6">
      {/* Header con estado y acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge
            className={
              abono.estado === 'ACTIVO'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
            }
          >
            {abono.estado}
          </Badge>
          {abono.tieneDeuda && (
            <Badge variant="destructive">Con deuda pendiente</Badge>
          )}
        </div>
        <Link href={boletasUrl}>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Ver Boletas
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="abonado">Abonado</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Información del Abono */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Información del Abono
              </CardTitle>
              <CardDescription>
                Detalles de la plaza y tarifa mensual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Playa
                  </p>
                  <p className="text-lg font-semibold">{abono.playaNombre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Plaza
                  </p>
                  <p className="text-lg font-semibold">
                    {abono.plazaIdentificador} ({abono.tipoPlazaNombre})
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Fecha de Inicio
                  </p>
                  <p className="text-sm">{formatDate(abono.fechaHoraInicio)}</p>
                </div>
                {abono.fechaFin && (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Fecha de Finalización
                    </p>
                    <p className="text-sm">{formatDate(abono.fechaFin)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Precio Mensual
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(abono.precioMensual)}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-blue-400" />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Las boletas se generan automáticamente el día 1 de cada mes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abonado" className="space-y-4">
          {/* Información del Abonado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Abonado
              </CardTitle>
              <CardDescription>Datos personales y de contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 flex items-center gap-4 rounded-lg p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 dark:bg-blue-900/20">
                  {abono.abonadoNombre[0]}
                  {abono.abonadoApellido[0]}
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {abono.abonadoNombre} {abono.abonadoApellido}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    ID: {abono.abonadoId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    DNI
                  </p>
                  <p className="text-lg font-semibold">{abono.abonadoDni}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Fecha de Alta
                  </p>
                  <p className="text-sm">
                    {formatDate(abono.abonadoFechaAlta)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold">Contacto</h4>
                {abono.abonadoEmail ? (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Email
                    </p>
                    <a
                      href={`mailto:${abono.abonadoEmail}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {abono.abonadoEmail}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sin email registrado
                  </p>
                )}

                {abono.abonadoTelefono ? (
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Teléfono
                    </p>
                    <a
                      href={`tel:${abono.abonadoTelefono}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {abono.abonadoTelefono}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Sin teléfono registrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos" className="space-y-4">
          {/* Vehículos Registrados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Vehículos Registrados
              </CardTitle>
              <CardDescription>
                Vehículos asociados a este abono ({abono.vehiculos.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {abono.vehiculos.map((vehiculo) => (
                  <Card key={vehiculo.patente}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-bold">
                            {vehiculo.patente}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {TIPO_VEHICULO_LABEL[vehiculo.tipoVehiculo]}
                          </p>
                        </div>
                        <Badge variant="outline">{vehiculo.tipoVehiculo}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
