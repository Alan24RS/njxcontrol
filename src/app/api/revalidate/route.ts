import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUser } from '@/lib/supabase/server'
import {
  revalidateAll,
  revalidateMetodosPago,
  revalidateModalidadesOcupacion,
  revalidatePlayas,
  revalidatePlayasCercanas,
  revalidatePlayaStats,
  revalidatePlazas,
  revalidateTarifas,
  revalidateTiposPlaza,
  revalidateTiposVehiculo
} from '@/utils/revalidation'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const userId = searchParams.get('userId')

    switch (type) {
      case 'playas':
        await revalidatePlayas()
        break
      case 'playa-stats':
        await revalidatePlayaStats(userId || undefined)
        break
      case 'playas-cercanas':
        await revalidatePlayasCercanas()
        break
      case 'metodos-pago':
        await revalidateMetodosPago()
        break
      case 'modalidades-ocupacion':
        await revalidateModalidadesOcupacion()
        break
      case 'tipos-plaza':
        await revalidateTiposPlaza()
        break
      case 'tipos-vehiculo':
        await revalidateTiposVehiculo()
        break
      case 'tarifas':
        await revalidateTarifas()
        break
      case 'plazas':
        await revalidatePlazas()
        break
      case 'all':
        await revalidateAll()
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de revalidación no válido' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      {
        message: `Cache revalidado exitosamente para: ${type}`,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error revalidando cache:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
