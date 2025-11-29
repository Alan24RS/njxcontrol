'use client'

import { useQuery } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/browser'

export interface PlayeroOption {
  playero_id: string
  usuario_nombre: string
}

/**
 * Hook para obtener playeros de las playas del usuario
 * Retorna lista simplificada para filtros de analytics
 */
export function useGetPlayeros(playaIds?: string[]) {
  return useQuery({
    queryKey: ['analytics-playeros', playaIds],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('v_playeros')
        .select('playero_id, usuario_nombre')
        .not('playero_id', 'is', null)
        .order('usuario_nombre')

      if (playaIds && playaIds.length > 0) {
        // Filtrar por playas específicas si se proporcionan
        const { data: relaciones } = await supabase
          .from('playero_playa')
          .select('playero_id')
          .in('playa_id', playaIds)

        if (relaciones) {
          const playeroIds = [...new Set(relaciones.map((r) => r.playero_id))]
          query = query.in('playero_id', playeroIds)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('[useGetPlayeros] Error:', error)
        throw new Error(`Error al obtener playeros: ${error.message}`)
      }

      return (data ?? []) as PlayeroOption[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: true
  })
}
