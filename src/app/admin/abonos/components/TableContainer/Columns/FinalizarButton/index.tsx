'use client'

import { useState } from 'react'

import { ActionColumnButton } from '@/components/ui'

import FinalizarAbonoModal from '../../../FinalizarAbonoModal'

interface FinalizarButtonProps {
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
        icon="cancel"
        tooltip="Finalizar abono"
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <FinalizarAbonoModal
          playaId={playaId}
          plazaId={plazaId}
          fechaHoraInicio={fechaHoraInicio}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
