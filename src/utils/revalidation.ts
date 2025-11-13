'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

import { CACHE_TAGS } from '@/constants/cache'

export async function revalidatePlayas() {
  revalidateTag(CACHE_TAGS.PLAYAS)
  revalidateTag(CACHE_TAGS.PLAYAS_PUBLICAS)
  revalidateTag(CACHE_TAGS.PLAYA_STATS)
  revalidateTag(CACHE_TAGS.PLAYAS_CERCANAS)
}

export async function revalidatePlayaStats(userId?: string) {
  if (userId) {
    revalidateTag(`playa-stats-${userId}`)
  } else {
    revalidateTag(CACHE_TAGS.PLAYA_STATS)
  }
}

export async function revalidatePlayasCercanas(
  latitud?: number,
  longitud?: number,
  radio?: number
) {
  if (latitud && longitud && radio) {
    revalidateTag(`playas-cercanas-${latitud}-${longitud}-${radio}`)
  } else {
    revalidateTag(CACHE_TAGS.PLAYAS_CERCANAS)
  }
}

export async function revalidateMetodosPago() {
  revalidateTag(CACHE_TAGS.METODOS_PAGO)
}

export async function revalidateModalidadesOcupacion() {
  revalidateTag(CACHE_TAGS.MODALIDADES_OCUPACION)
}

export async function revalidateTiposPlaza() {
  revalidateTag(CACHE_TAGS.TIPOS_PLAZA)
}

export async function revalidateTiposVehiculo() {
  revalidateTag(CACHE_TAGS.TIPOS_VEHICULO)
}

export async function revalidateTarifas() {
  revalidateTag(CACHE_TAGS.TARIFAS)
}

export async function revalidatePlazas() {
  revalidateTag(CACHE_TAGS.PLAZAS)
}

export async function revalidateAdminPath() {
  revalidatePath('/admin')
}

export async function revalidateAll() {
  Object.values(CACHE_TAGS).forEach((tag) => {
    revalidateTag(tag)
  })
  revalidatePath('/')
}
