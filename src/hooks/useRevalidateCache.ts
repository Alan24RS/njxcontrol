'use client'

import { useState } from 'react'

type RevalidationType =
  | 'playas'
  | 'playa-stats'
  | 'playas-cercanas'
  | 'metodos-pago'
  | 'modalidades-ocupacion'
  | 'tipos-plaza'
  | 'tipos-vehiculo'
  | 'tarifas'
  | 'plazas'
  | 'all'

export function useRevalidateCache() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const revalidate = async (type: RevalidationType, userId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ type })
      if (userId) {
        params.append('userId', userId)
      }

      const response = await fetch(`/api/revalidate?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error revalidando cache')
      }

      const data = await response.json()

      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error revalidando cache:', errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    revalidate,
    isLoading,
    error
  }
}
