import type { DisponibilidadTipoPlaza } from '@/services/playas/types'

interface DisponibilidadBadgeProps {
  disponibilidad: DisponibilidadTipoPlaza[]
  totalDisponibles: number
  className?: string
}

export function DisponibilidadBadge({
  disponibilidad,
  totalDisponibles,
  className = ''
}: DisponibilidadBadgeProps) {
  // Determinar color basado en disponibilidad
  const getColorClass = () => {
    if (totalDisponibles === 0) {
      return 'bg-red-500 text-white'
    }
    const totalPlazas = disponibilidad.reduce(
      (sum, d) => sum + d.totalPlazas,
      0
    )
    const porcentaje = (totalDisponibles / totalPlazas) * 100

    if (porcentaje >= 50) {
      return 'bg-green-500 text-white'
    } else if (porcentaje >= 20) {
      return 'bg-yellow-500 text-white'
    } else {
      return 'bg-orange-500 text-white'
    }
  }

  return (
    <div className={`${className}`}>
      <div
        className={`${getColorClass()} flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm`}
      >
        <span>🅿️</span>
        <span>{totalDisponibles}</span>
      </div>
    </div>
  )
}

interface DisponibilidadDetalleProps {
  disponibilidad: DisponibilidadTipoPlaza[]
  totalPlazas: number
  totalDisponibles: number
}

export function DisponibilidadDetalle({
  disponibilidad,
  totalPlazas,
  totalDisponibles
}: DisponibilidadDetalleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Disponibilidad</span>
        <span className="text-primary text-sm font-bold">
          {totalDisponibles} de {totalPlazas} plazas
        </span>
      </div>

      <div className="space-y-1.5">
        {disponibilidad.map((disp) => (
          <div
            key={disp.tipoPlazaId}
            className="bg-muted/50 flex items-center justify-between rounded-md p-2"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{disp.tipoPlazaNombre}</p>
              {disp.tipoPlazaDescripcion && (
                <p className="text-muted-foreground text-xs">
                  {disp.tipoPlazaDescripcion}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-semibold ${
                  disp.plazasDisponibles > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {disp.plazasDisponibles}
              </span>
              <span className="text-muted-foreground">
                / {disp.totalPlazas}
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalDisponibles === 0 && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-950/20">
          <p className="text-center text-xs text-red-600 dark:text-red-400">
            ⚠️ No hay plazas disponibles en este momento
          </p>
        </div>
      )}
    </div>
  )
}
