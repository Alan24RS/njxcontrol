'use client'

import { useRef, useState } from 'react'

import { ColorScheme, InfoWindow } from '@vis.gl/react-google-maps'
import { ChevronRight, Clock, MapPin, Navigation, X } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui'
import {
  DisponibilidadBadge,
  DisponibilidadDetalle
} from '@/components/ui/DisponibilidadPlazas'
import Map from '@/components/ui/GoogleMaps/Map'
import PlayaMarker from '@/components/ui/GoogleMaps/PlayaMarker'
import { useGetPlayasConDisponibilidad } from '@/hooks/queries/playas/useGetPlayasConDisponibilidad'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { PlayaConDisponibilidad } from '@/services/playas/types'

export default function MapaContainer() {
  const [selectedPlaya, setSelectedPlaya] =
    useState<PlayaConDisponibilidad | null>(null)
  const markerClickedRef = useRef(false)
  const { isDark } = useAdminTheme()

  const {
    isLoading: isLoadingLocation,
    isError,
    location
  } = useGeolocation({
    askGeolocation: false // Cambiado a false para no pedir ubicación automáticamente
  })

  const {
    data: playasData,
    isLoading: isLoadingPlayas,
    error: playasError
  } = useGetPlayasConDisponibilidad()

  const playas = playasData?.data || []
  const isLoading = isLoadingLocation || isLoadingPlayas

  // Debug: log para verificar datos
  console.log('🔍 MapaContainer - playasData:', playasData)
  console.log('🔍 MapaContainer - playas:', playas)
  console.log('🔍 MapaContainer - isLoadingPlayas:', isLoadingPlayas)
  console.log('🔍 MapaContainer - playasError:', playasError)

  // Calcular el centro y zoom óptimo para mostrar todas las playas
  const mapCenter = location
    ? { lat: location.latitude, lng: location.longitude }
    : playas.length > 0
      ? {
          lat:
            playas.reduce((sum, p) => sum + (p.latitud || 0), 0) /
            playas.length,
          lng:
            playas.reduce((sum, p) => sum + (p.longitud || 0), 0) /
            playas.length
        }
      : undefined

  // Zoom más alejado cuando no hay ubicación del usuario
  const mapZoom = location ? 15 : 12

  console.log('🔍 MapaContainer - mapCenter:', mapCenter)
  console.log('🔍 MapaContainer - mapZoom:', mapZoom)

  if (playasError) {
    throw playasError
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Obteniendo tu ubicación...</div>
          <div className="text-muted-foreground">
            Esto puede tomar unos segundos
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {isError && (
        <div className="flex items-center bg-red-500 p-2 text-white">
          <span className="text-sm font-semibold">
            La geolocalización no está habilitada. Por favor, habilítala en tu
            navegador.
          </span>
        </div>
      )}

      <div className="relative flex flex-1">
        <Map
          showUserLocation
          gestureHandling="greedy"
          colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
          userLocation={location}
          center={mapCenter}
          initialZoom={mapZoom}
          onClick={() => {
            if (markerClickedRef.current) return
            if (selectedPlaya) setSelectedPlaya(null)
          }}
        >
          {console.log(
            '🔍 MapaContainer - Rendering markers for playas:',
            playas.length
          )}
          {playas.map((playa) => {
            console.log('🔍 MapaContainer - Rendering playa:', {
              id: playa.id,
              nombre: playa.nombre,
              latitud: playa.latitud,
              longitud: playa.longitud,
              hasLatLng: !!(playa.latitud && playa.longitud)
            })

            if (!playa.latitud || !playa.longitud) {
              console.warn('⚠️ Playa sin coordenadas:', playa.nombre)
              return null
            }

            return (
              <PlayaMarker
                key={playa.id}
                position={{ lat: playa.latitud, lng: playa.longitud }}
                title={playa.direccion}
                onClick={() => {
                  markerClickedRef.current = true
                  setSelectedPlaya(playa)
                  setTimeout(() => {
                    markerClickedRef.current = false
                  }, 100)
                }}
              >
                <DisponibilidadBadge
                  disponibilidad={playa.disponibilidadPorTipo}
                  totalDisponibles={playa.totalDisponibles}
                  className="absolute -top-2 -right-2"
                />
              </PlayaMarker>
            )
          })}

          {selectedPlaya && (
            <InfoWindow
              position={{
                lat: selectedPlaya.latitud!,
                lng: selectedPlaya.longitud!
              }}
              onCloseClick={() => setSelectedPlaya(null)}
              headerDisabled
            >
              <Card className="max-w-sm border-0 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-primary h-4 w-4" />
                      {selectedPlaya.nombre || selectedPlaya.direccion}
                    </div>
                    <button
                      onClick={() => setSelectedPlaya(null)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm p-1 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selectedPlaya.descripcion && (
                    <CardDescription className="mb-2">
                      {selectedPlaya.descripcion}
                    </CardDescription>
                  )}
                  <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {selectedPlaya.horario}
                  </div>

                  {/* Información de disponibilidad */}
                  <div className="mb-3">
                    <DisponibilidadDetalle
                      disponibilidad={selectedPlaya.disponibilidadPorTipo}
                      totalPlazas={selectedPlaya.totalPlazas}
                      totalDisponibles={selectedPlaya.totalDisponibles}
                    />
                  </div>

                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlaya.latitud},${selectedPlaya.longitud}`
                      window.open(url, '_blank')
                    }}
                    className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium"
                  >
                    <Navigation className="h-4 w-4" />
                    Ir a esta playa
                  </button>
                </CardContent>
              </Card>
            </InfoWindow>
          )}
        </Map>

        {playas.length > 0 && (
          <div className="bg-background absolute top-4 left-4 z-10 hidden max-h-96 w-72 overflow-y-auto rounded-lg border shadow-lg md:block">
            <div className="p-4">
              <h2 className="mb-4 text-lg font-semibold">
                Playas disponibles ({playas.length})
              </h2>
              <div className="space-y-3">
                {playas.map((playa) => (
                  <Card
                    key={playa.id}
                    className={`hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedPlaya?.id === playa.id
                        ? 'ring-primary ring-2'
                        : ''
                    }`}
                    onClick={() => setSelectedPlaya(playa)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="text-primary mt-0.5 h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {playa.nombre || playa.direccion}
                            </p>
                            <DisponibilidadBadge
                              disponibilidad={playa.disponibilidadPorTipo}
                              totalDisponibles={playa.totalDisponibles}
                            />
                          </div>
                          {playa.descripcion && (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                              {playa.descripcion}
                            </p>
                          )}
                          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3" />
                            {playa.horario}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={() =>
            (window.location.href = '/auth/login?next=/playas/registrar')
          }
          className="bg-primary hover:bg-primary/90 fixed bottom-6 left-1/2 z-20 -translate-x-1/2 shadow-lg"
          size="lg"
        >
          <ChevronRight className="mr-2 h-5 w-5" />
          Haz tu playa visible aqui!
        </Button>
      </div>
    </>
  )
}
