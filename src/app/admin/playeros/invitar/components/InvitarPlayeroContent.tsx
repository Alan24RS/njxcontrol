'use client'

import { useQuery } from '@tanstack/react-query'

import { Spinner } from '@/components/ui'
import { checkIfOwnerIsPlayero } from '@/services/playeros/checkIfOwnerIsPlayero'

import InvitarPlayeroForm from './InvitarPlayeroForm'
import SelfAssignInfoCard from './SelfAssignInfoCard'

export default function InvitarPlayeroContent() {
  const {
    data: checkResult,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['check-owner-is-playero'],
    queryFn: () => checkIfOwnerIsPlayero()
  })

  // Mostrar loading mientras se verifica si el usuario es playero
  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  // Si hay error, mostrar solo el formulario
  if (isError || checkResult?.error) {
    return <InvitarPlayeroForm />
  }

  const isOwnerPlayero = checkResult?.data?.isPlayero || false

  return (
    <div className="space-y-6">
      {/* Solo mostrar InfoCard si el dueño NO es playero */}
      {!isOwnerPlayero && (
        <div className="flex flex-col gap-4">
          <SelfAssignInfoCard />
        </div>
      )}

      <InvitarPlayeroForm />
    </div>
  )
}
