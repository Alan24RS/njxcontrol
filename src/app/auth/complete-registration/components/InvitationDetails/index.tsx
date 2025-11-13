'use client'

import { Building, Calendar, MapPin, User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useGetInvitationDetails } from '@/hooks/queries/playeros/useGetInvitationDetails'

interface InvitationDetailsProps {
  email: string
  duenoId: string
}

export default function InvitationDetailsComponent({
  email,
  duenoId
}: InvitationDetailsProps) {
  const {
    data: result,
    isLoading: loading,
    error: queryError
  } = useGetInvitationDetails(email, duenoId)

  const details = result?.data
  const error = result?.error || queryError?.message

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !details) {
    const isInvitationNotFound = error === 'Invitación no encontrada o expirada'

    return (
      <Card
        className={`w-full ${isInvitationNotFound ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
      >
        <CardContent className="p-6">
          <p
            className={`${isInvitationNotFound ? 'text-red-800' : 'text-yellow-800'}`}
          >
            {isInvitationNotFound ? (
              <>
                <strong>Invitación no disponible</strong>
                <br />
                La invitación que intentas usar no existe, ha expirado o fue
                eliminada por el administrador.
              </>
            ) : (
              error || 'No se encontraron detalles de invitación'
            )}
          </p>
          <p
            className={`mt-2 text-sm ${isInvitationNotFound ? 'text-red-600' : 'text-yellow-600'}`}
          >
            {isInvitationNotFound
              ? 'Por favor, contacta al administrador para que te envíe una nueva invitación.'
              : 'Puedes continuar con el registro normal.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <User className="h-5 w-5" />
          Detalles de tu Invitación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-blue-700">Invitado por:</p>
            <p className="text-blue-900">{details.dueno_nombre}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">
              Nombre asignado:
            </p>
            <p className="text-blue-900">{details.nombre_asignado}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1 text-sm font-medium text-blue-700">
            <Building className="h-4 w-4" />
            Playas asignadas ({details.playas.length}):
          </p>
          <div className="space-y-2">
            {details.playas.map((playa) => (
              <div
                key={playa.playa_id}
                className="rounded-lg border border-blue-200 bg-white p-3"
              >
                <p className="font-medium text-blue-900">{playa.nombre}</p>
                <p className="flex items-center gap-1 text-sm text-blue-700">
                  <MapPin className="h-3 w-3" />
                  {playa.direccion}
                </p>
                {playa.descripcion && (
                  <p className="mt-1 text-sm text-blue-600">
                    {playa.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Calendar className="h-4 w-4" />
          <span>
            Invitación enviada:{' '}
            {new Date(details.fecha_invitacion).toLocaleDateString()}
          </span>
        </div>

        <div className="rounded-lg bg-blue-100 p-3">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Puedes cambiar tu nombre en el formulario si
            lo deseas. Al completar el registro, tendrás acceso a las playas
            asignadas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
