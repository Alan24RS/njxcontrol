'use client'

import { useState } from 'react'

import { ActionColumnButton } from '@/components/ui'

import EditAbonoDialog from '../../../EditAbonoDialog'

interface EditButtonProps {
  playaId: string
  plazaId: string
  fechaHoraInicio: string
}

export function EditButton({
  playaId,
  plazaId,
  fechaHoraInicio
}: EditButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <ActionColumnButton
        icon="edit"
        tooltip="Editar abono"
        onClick={() => setIsOpen(true)}
      />

      {isOpen && (
        <EditAbonoDialog
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
