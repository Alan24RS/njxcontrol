'use client'

import { useQuery } from '@tanstack/react-query'

import {
  getMetodosPagoPlaya,
  type GetMetodosPagoPlayaParams
} from '@/services/metodos-pago-playa'

export const useGetMetodosPagoPlaya = (
  params: GetMetodosPagoPlayaParams,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['metodos-pago-playa', params],
    queryFn: () => getMetodosPagoPlaya(params),
    enabled: options?.enabled
  })
}
