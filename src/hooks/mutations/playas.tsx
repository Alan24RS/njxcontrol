import { useMutation } from '@tanstack/react-query'

import { deletePlaya } from '@/services/playas/deletePlaya'

export const useDeletePlaya = () => {
  return useMutation({ mutationFn: (id: string) => deletePlaya(id) })
}
