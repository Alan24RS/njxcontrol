'use server'

import { unstable_cache } from 'next/cache'

import { CACHE_TAGS, CACHE_TIMES } from '@/constants/cache'
import { OCUPACION_ESTADO_LABEL } from '@/constants/ocupacionEstado'
import {
  TIPO_VEHICULO_LABEL,
  type TipoVehiculo
} from '@/constants/tipoVehiculo'
import { createCachedClient } from '@/lib/supabase/cached-server'
import { ApiResponse, Filters } from '@/types/api'
import { translateDBError } from '@/utils/errorMessages'

export type GetOcupacionFiltersParams = {
  playaId: string
  appliedFilters?: Record<string, string[]>
}

export const getOcupacionFilters = async (
  args: GetOcupacionFiltersParams
): Promise<ApiResponse<Filters>> => {
  const filtersKey = args.appliedFilters
    ? JSON.stringify(args.appliedFilters)
    : 'none'
  const cacheKey = `ocupacion-filters-${args.playaId}-${filtersKey}`

  return unstable_cache(
    async (): Promise<ApiResponse<Filters>> => {
      const supabase = createCachedClient()

      try {
        // Obtener playeros de la playa actual desde playero_playa con JOIN a usuario
        const { data: playerosRaw, error: playerosError } = await supabase
          .from('playero_playa')
          .select(
            `
            playero_id,
            usuario:usuario!playero_playa_playero_id_fkey (
              usuario_id,
              nombre
            )
          `
          )
          .eq('playa_id', args.playaId)
          .eq('estado', 'ACTIVO')
          .is('fecha_baja', null)

        if (playerosError) {
          return {
            data: null,
            error: translateDBError(playerosError.message)
          }
        }

        // Transformar los datos y eliminar duplicados
        const playeros = playerosRaw
          ?.filter((p: any) => p.usuario)
          .map((p: any) => ({
            usuario_id: p.usuario.usuario_id,
            usuario_nombre: p.usuario.nombre
          }))
          .filter(
            (p, index, self) =>
              index === self.findIndex((t) => t.usuario_id === p.usuario_id)
          )
          .sort((a, b) => a.usuario_nombre.localeCompare(b.usuario_nombre))

        // Obtener tipos de vehículo de la playa
        const { data: tiposVehiculo, error: tiposError } = await supabase
          .from('tipo_vehiculo_playa')
          .select('tipo_vehiculo')
          .eq('playa_id', args.playaId)
          .eq('estado', 'ACTIVO')
          .order('tipo_vehiculo')

        if (tiposError) {
          return {
            data: null,
            error: translateDBError(tiposError.message)
          }
        }

        // Obtener modalidades de ocupación de la playa
        const { data: modalidades, error: modalidadesError } = await supabase
          .from('v_modalidades_ocupacion')
          .select('modalidad_ocupacion, modalidad_label')
          .eq('playa_id', args.playaId)
          .eq('estado', 'ACTIVO')
          .order('modalidad_label')

        if (modalidadesError) {
          return {
            data: null,
            error: translateDBError(modalidadesError.message)
          }
        }

        // Construir filtros
        const filters: Filters = {
          estado: {
            title: 'Estado',
            options: [
              {
                label: OCUPACION_ESTADO_LABEL.ACTIVO,
                value: 'ACTIVO'
              },
              {
                label: OCUPACION_ESTADO_LABEL.FINALIZADO,
                value: 'FINALIZADO'
              }
            ]
          },
          playero: {
            title: 'Playero (abre o cierra)',
            options:
              playeros?.map((p) => ({
                label: p.usuario_nombre || 'Sin nombre',
                value: p.usuario_id
              })) || []
          },
          tipoVehiculo: {
            title: 'Tipo de vehículo',
            options:
              tiposVehiculo?.map((tv) => ({
                label:
                  TIPO_VEHICULO_LABEL[tv.tipo_vehiculo as TipoVehiculo] ||
                  tv.tipo_vehiculo,
                value: tv.tipo_vehiculo
              })) || []
          },
          modalidadOcupacion: {
            title: 'Modalidad',
            options:
              modalidades?.map((m) => ({
                label: m.modalidad_label || m.modalidad_ocupacion,
                value: m.modalidad_ocupacion
              })) || []
          },
          date: {
            title: 'Rango de fechas',
            options: []
          }
        }

        return {
          data: filters,
          error: null
        }
      } catch {
        return {
          data: null,
          error: 'Error al obtener filtros de ocupaciones'
        }
      }
    },
    [cacheKey],
    {
      tags: [CACHE_TAGS.PLAZAS, cacheKey],
      revalidate: CACHE_TIMES.PLAZAS
    }
  )()
}
