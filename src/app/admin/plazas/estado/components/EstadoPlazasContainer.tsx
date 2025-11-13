'use client'

import { AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle, Spinner } from '@/components/ui'
import { useGetPlazasConEstado } from '@/hooks/queries/plazas/useGetPlazasConEstado'
import { useSelectedPlaya } from '@/stores'

import PlazaEstadoCard from './PlazaEstadoCard'

export default function EstadoPlazasContainer() {
  const { selectedPlaya, isLoading: isPlayaLoading } = useSelectedPlaya()

  const {
    data: result,
    isLoading: isLoadingPlazas,
    error
  } = useGetPlazasConEstado(selectedPlaya!.id!, {
    enabled: !!selectedPlaya?.id && !isPlayaLoading,
    // Refrescar los datos cada 30 segundos
    refetchInterval: 30000
  })

  const isLoading = isPlayaLoading || isLoadingPlazas

  if (!selectedPlaya && !isPlayaLoading) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Alert className="w-fit">
          <AlertTriangle />
          <AlertTitle>Seleccione una playa</AlertTitle>
          <AlertDescription>
            Para ver el estado de las plazas, primero debe seleccionar una playa
            desde la barra lateral.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Spinner />
      </div>
    )
  }

  if (error || result?.error) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <Alert className="w-fit" variant="destructive">
          <AlertTriangle />
          <AlertTitle>Hubo un problema</AlertTitle>
          <AlertDescription>
            {result?.error ||
              error?.message ||
              'Intente nuevamente o comuníquese con el area de sistemas'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const plazas = result?.data || []
  const total = plazas.length
  const disponibles = plazas.filter(
    (p) => p.estado_operativo === 'Disponible'
  ).length

  return (
    <div className="flex w-full grow flex-col gap-4 px-6 sm:px-0">
      {/* Resumen */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold">
          Plazas Disponibles:{' '}
          <span className="text-green-600">
            {disponibles} / {total}
          </span>
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="h-3 w-3 rounded-full bg-gray-400" />
            <span>Fuera de servicio</span>
          </div>
        </div>
      </div>

      {/* Cuadrícula de Plazas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {plazas.map((plaza) => (
          <PlazaEstadoCard key={plaza.plaza_id} plaza={plaza} />
        ))}
      </div>
    </div>
  )
}
