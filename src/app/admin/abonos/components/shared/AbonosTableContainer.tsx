'use client'

import { Spinner } from '@/components/ui'
import { MessageCard } from '@/components/ui/MessageCard'
import { useGetAbonosVigentes } from '@/hooks/queries/abonos/getAbonosVigentes'
import type { AbonoVigente } from '@/services/abonos'
import { useSelectedPlaya } from '@/stores/useSelectedPlaya'

export type TableData = {
  data: AbonoVigente[]
}

type AbonosTableContainerProps = {
  filterByPlaya?: boolean
  children: (data: { abonos: AbonoVigente[] }) => React.ReactNode
}

export default function AbonosTableContainer({
  filterByPlaya = false,
  children
}: AbonosTableContainerProps) {
  const { selectedPlaya, isLoading: playaLoading } = useSelectedPlaya()

  const playaId = filterByPlaya ? selectedPlaya?.id : undefined

  const {
    data: response,
    error,
    isLoading: abonosLoading,
    isError
  } = useGetAbonosVigentes(playaId)

  const isLoading = filterByPlaya
    ? playaLoading || abonosLoading
    : abonosLoading

  if (isLoading) {
    return (
      <div className="flex w-full grow items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (filterByPlaya && !selectedPlaya) {
    return (
      <div className="flex w-full grow items-center justify-center px-4 sm:px-0">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Selecciona una playa</h3>
          <p className="text-muted-foreground">
            Debes seleccionar una playa para ver los abonos
          </p>
        </div>
      </div>
    )
  }

  if (isError || error || response?.error) {
    return <MessageCard />
  }

  const abonos = response?.data || []

  return <>{children({ abonos })}</>
}
