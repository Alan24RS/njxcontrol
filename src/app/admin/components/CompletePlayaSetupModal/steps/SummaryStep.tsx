'use client'

import { useFormContext } from 'react-hook-form'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui'
import { METODO_PAGO_LABEL } from '@/constants/metodoPago'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import type { WelcomeSetupFormData } from '@/schemas/welcome-setup'

export default function SummaryStep() {
  const { watch } = useFormContext<WelcomeSetupFormData>()

  const formData = watch()

  const getUniqueModalidades = () => {
    const modalidades = new Set<string>()
    formData.tarifas?.forEach((tarifa) => {
      modalidades.add(tarifa.modalidadOcupacion)
    })
    return Array.from(modalidades)
  }

  const getUniqueTiposVehiculo = () => {
    const tipos = new Set<string>()
    formData.tarifas?.forEach((tarifa) => {
      tipos.add(tarifa.tipoVehiculo)
    })
    return Array.from(tipos)
  }

  return (
    <div className="space-y-6">
      {/* Datos de la Playa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la Playa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Ubicación:</span>{' '}
            {formData.playa?.direccion}
          </div>
          <div>
            <span className="font-medium">Horario:</span>{' '}
            {formData.playa?.horario}
          </div>
          {formData.playa?.descripcion && (
            <div>
              <span className="font-medium">Descripción:</span>{' '}
              {formData.playa.descripcion}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Plaza */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tipos de Plaza a crear ({formData.tiposPlaza?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.tiposPlaza?.map((tipo, index) => (
            <div key={index} className="border-l-2 border-blue-200 py-2 pl-4">
              <div className="font-medium">{tipo.nombre}</div>
              {tipo.descripcion && (
                <div className="text-muted-foreground text-sm">
                  {tipo.descripcion}
                </div>
              )}
              <div className="text-muted-foreground mt-1 text-xs">
                {tipo.caracteristicas?.length || 0} características
                seleccionadas
              </div>
            </div>
          )) || (
            <div className="text-muted-foreground text-sm">
              No hay tipos de plaza definidos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modalidades de Ocupación Dinámicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Modalidades de Ocupación a crear ({getUniqueModalidades().length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getUniqueModalidades().map((modalidad, index) => (
              <Badge key={index} variant="secondary">
                {
                  MODALIDAD_OCUPACION_LABEL[
                    modalidad as keyof typeof MODALIDAD_OCUPACION_LABEL
                  ]
                }
              </Badge>
            )) || (
              <div className="text-muted-foreground text-sm">
                No hay modalidades definidas
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Estas modalidades se crearán automáticamente basadas en las tarifas
            configuradas
          </p>
        </CardContent>
      </Card>

      {/* Tipos de Vehículo Dinámicos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tipos de Vehículo a crear ({getUniqueTiposVehiculo().length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getUniqueTiposVehiculo().map((tipo, index) => (
              <Badge key={index} variant="secondary">
                {TIPO_VEHICULO_LABEL[tipo]}
              </Badge>
            )) || (
              <div className="text-muted-foreground text-sm">
                No hay tipos de vehículo definidos
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Estos tipos se crearán automáticamente basados en las tarifas
            configuradas
          </p>
        </CardContent>
      </Card>

      {/* Métodos de Pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Métodos de Pago a crear ({formData.metodosPago?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.metodosPago?.map((metodo, index) => (
              <Badge key={index} variant="secondary">
                {METODO_PAGO_LABEL[metodo.metodoPago]}
              </Badge>
            )) || (
              <div className="text-muted-foreground text-sm">
                No hay métodos de pago definidos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tarifas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tarifas a crear ({formData.tarifas?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.tarifas?.map((tarifa, index) => {
            const tipoPlaza = formData.tiposPlaza?.[tarifa.tipoPlazaIndex]
            return (
              <div
                key={index}
                className="border-l-2 border-yellow-200 py-2 pl-4"
              >
                <div className="font-medium">
                  {tipoPlaza?.nombre} -{' '}
                  {
                    MODALIDAD_OCUPACION_LABEL[
                      tarifa.modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
                    ]
                  }{' '}
                  - {TIPO_VEHICULO_LABEL[tarifa.tipoVehiculo]}
                </div>
                <div className="text-lg font-bold text-green-600">
                  ${' '}
                  {tarifa.precioBase?.toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            )
          }) || (
            <div className="text-muted-foreground text-sm">
              No hay tarifas definidas
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-400 dark:bg-sky-900/20">
        <h4 className="mb-2 font-medium dark:text-sky-500">
          ¡Listo para crear!
        </h4>
        <p className="text-sm text-sky-700 dark:text-sky-300">
          Al hacer clic en &quot;Crear configuración completa&quot;, se creará
          toda la estructura de tu playa con todos los datos configurados. Tu
          playa quedará en modo borrador hasta que la actives desde el panel de
          administración.
        </p>
      </div>
    </div>
  )
}
