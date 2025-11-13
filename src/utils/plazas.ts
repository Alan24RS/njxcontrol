import type { Plaza } from '@/services/plazas/types'

export function getPlazaLabel(plaza: Plaza | null) {
  if (!plaza) return ''
  return plaza.identificador?.trim()
    ? `${plaza.identificador}`
    : `Plaza ${plaza.id}`
}
