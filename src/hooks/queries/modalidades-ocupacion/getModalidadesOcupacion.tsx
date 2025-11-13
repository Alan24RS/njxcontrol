import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { getModalidadesOcupacion } from '@/services/modalidades-ocupacion'
import type {
  GetModalidadesOcupacionParams,
  ModalidadOcupacionPlaya
} from '@/services/modalidades-ocupacion/types'
import type { ApiResponse } from '@/types/api'

export const useGetModalidadesOcupacion = (
  params: GetModalidadesOcupacionParams,
  options?: Omit<
    UseQueryOptions<ApiResponse<ModalidadOcupacionPlaya[]>>,
    'queryKey' | 'queryFn'
  >
) => {
  const { playaId } = params
  return useQuery<ApiResponse<ModalidadOcupacionPlaya[]>>({
    queryKey: ['modalidades-ocupacion', playaId, params],
    queryFn: async () => await getModalidadesOcupacion(params),
    ...options
  })
}
