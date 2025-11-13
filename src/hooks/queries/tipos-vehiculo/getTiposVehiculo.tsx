'use client'

import { useQuery } from '@tanstack/react-query'

import {
  getTiposVehiculo,
  type GetTiposVehiculoParams
} from '@/services/tipos-vehiculo'

export const useGetTiposVehiculo = (
  params: GetTiposVehiculoParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['tipos-vehiculo', params],
    queryFn: () => getTiposVehiculo(params),
    enabled: options?.enabled
  })
}
