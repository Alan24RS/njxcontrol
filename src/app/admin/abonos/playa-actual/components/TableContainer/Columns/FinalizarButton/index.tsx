'use client'

import { useState } from 'react'

import { FinalizarAbonoModal } from '@/app/admin/abonos/components'
import { ActionColumnButton } from '@/components/ui'

type FinalizarButtonProps = {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export function FinalizarButton({
  playaId,
  plazaId,
  fechaHoraInicio
}: FinalizarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <ActionColumnButton
        icon="delete"
        tooltip="Finalizar abono"
        onClick={() => setIsOpen(true)}
      />
      <FinalizarAbonoModal
        playaId={playaId}
        plazaId={plazaId}
        fechaHoraInicio={fechaHoraInicio}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
