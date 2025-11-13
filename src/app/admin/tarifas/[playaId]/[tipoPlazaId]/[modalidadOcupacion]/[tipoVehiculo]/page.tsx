import { Suspense } from 'react'

import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

import { PageContainer } from '@/components/layout'
import { BreadcrumbItem } from '@/components/layout/Breadcrumb'
import { Spinner } from '@/components/ui/spinner'
import { MODALIDAD_OCUPACION_LABEL } from '@/constants/modalidadOcupacion'
import { TIPO_VEHICULO_LABEL } from '@/constants/tipoVehiculo'
import { getAuthenticatedUser } from '@/lib/supabase/server'
import { getTarifa } from '@/services/tarifas'
import { generateSyncMetadata } from '@/utils/metadata'

import TarifaDetailForm from './components/TarifaDetailForm'

type Props = {
  params: Promise<{
    playaId: string
    tipoPlazaId: string
    modalidadOcupacion: string
    tipoVehiculo: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playaId, tipoPlazaId, modalidadOcupacion, tipoVehiculo } =
    await params

  let title = 'Tarifa no encontrada'

  try {
    const { data: tarifa, error } = await getTarifa(
      playaId,
      parseInt(tipoPlazaId),
      modalidadOcupacion,
      tipoVehiculo
    )
    if (tarifa && !error) {
      const modalidadLabel =
        MODALIDAD_OCUPACION_LABEL[
          modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
        ]
      const vehiculoLabel =
        TIPO_VEHICULO_LABEL[tipoVehiculo as keyof typeof TIPO_VEHICULO_LABEL]
      title = `Tarifa ${tarifa.tipoPlaza.nombre} - ${modalidadLabel} - ${vehiculoLabel}`
    }
  } catch (error) {
    console.warn('Error al generar metadata:', error)
  }

  return generateSyncMetadata({
    title,
    description: 'Información detallada de la tarifa',
    pageRoute: `/admin/tarifas/${playaId}/${tipoPlazaId}/${modalidadOcupacion}/${tipoVehiculo}`
  })
}

export default async function TarifaDetailPage({ params }: Props) {
  const { playaId, tipoPlazaId, modalidadOcupacion, tipoVehiculo } =
    await params
  const { data: tarifa, error } = await getTarifa(
    playaId,
    parseInt(tipoPlazaId),
    modalidadOcupacion,
    tipoVehiculo
  )

  if (error || !tarifa) {
    notFound()
  }

  const user = await getAuthenticatedUser()
  const isDueno = user?.roles.includes('DUENO') || false

  const modalidadLabel =
    MODALIDAD_OCUPACION_LABEL[
      modalidadOcupacion as keyof typeof MODALIDAD_OCUPACION_LABEL
    ]
  const vehiculoLabel =
    TIPO_VEHICULO_LABEL[tipoVehiculo as keyof typeof TIPO_VEHICULO_LABEL]

  const breadcrumb: BreadcrumbItem[] = [
    { label: 'Tarifas', href: '/admin/tarifas' },
    {
      label: `${tarifa.tipoPlaza.nombre} - ${modalidadLabel} - ${vehiculoLabel}`,
      href: `/admin/tarifas/${playaId}/${tipoPlazaId}/${modalidadOcupacion}/${tipoVehiculo}`
    }
  ]

  return (
    <PageContainer className="space-y-6 sm:px-6" breadcrumb={breadcrumb}>
      <div className="px-6 sm:px-0">
        <h1 className="text-2xl font-bold">Tarifa {tarifa.tipoPlaza.nombre}</h1>
        <p className="text-muted-foreground">
          {modalidadLabel} - {vehiculoLabel}
        </p>
        <p className="text-muted-foreground text-sm">
          {isDueno
            ? 'Revisa y edita la información de la tarifa'
            : 'Revisa la información de la tarifa'}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <TarifaDetailForm
          tarifa={tarifa}
          playaId={playaId}
          tipoPlazaId={parseInt(tipoPlazaId)}
          modalidadOcupacion={modalidadOcupacion}
          tipoVehiculo={tipoVehiculo}
          roles={user?.roles || []}
        />
      </Suspense>
    </PageContainer>
  )
}
