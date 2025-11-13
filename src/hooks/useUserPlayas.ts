import { useGetUserPlayas } from './queries/playas/useGetUserPlayas'

export default function useUserPlayas({
  assignedPlayas = [] as string[]
} = {}) {
  const { playas, isLoading, error } = useGetUserPlayas(assignedPlayas)

  return {
    playas,
    loading: isLoading,
    error: error?.message || null
  }
}
