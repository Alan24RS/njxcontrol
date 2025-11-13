'use client'

import PlazaField from './PlazaField'
import TipoPlazaField from './TipoPlazaField'
import TiposVehiculoField from './TiposVehiculoField'

export default function PlazaStep() {
  return (
    <div className="flex grow flex-col gap-6">
      <TiposVehiculoField />
      <div className="grid grid-cols-2 gap-6">
        <TipoPlazaField />
        <PlazaField />
      </div>
    </div>
  )
}
