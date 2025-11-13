'use client'

import { useState } from 'react'

import CompletePlayaSetupModal from '@/app/admin/components/CompletePlayaSetupModal'
import { Button } from '@/components/ui'

interface CreateCompletePlayaModalProps {
  userName: string
}

export default function CreateCompletePlayaModal({
  userName
}: CreateCompletePlayaModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex"
      >
        Crear playa completa
      </Button>

      {isOpen && (
        <CompletePlayaSetupModal
          userName={userName}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mode="create"
          title="Crear playa completa"
          description="Crea una nueva playa con todos sus datos en una sola transacción."
        />
      )}
    </>
  )
}
