'use client'

import { MessageCard } from '@/components/ui/MessageCard'
import { DB_ERROR_TRANSLATIONS } from '@/constants/translations'

interface ErrorPageProps {
  error: Error & { digest?: string }
}

export default function ErrorPage({ error }: ErrorPageProps) {
  const isDbError = Object.keys(DB_ERROR_TRANSLATIONS).includes(error.message)

  if (isDbError) {
    return (
      <MessageCard
        title="Servicio no disponible"
        description="No pudimos conectar con la base de datos"
        type="error"
      />
    )
  }

  return <MessageCard />
}
