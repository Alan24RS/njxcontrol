'use client'

import { useEffect, useState } from 'react'

import {
  APIProvider,
  ColorScheme,
  Map as GoogleMap,
  MapProps
} from '@vis.gl/react-google-maps'

import UserMarker from '@/components/ui/GoogleMaps/UserMarker'

interface MapCenter {
  lat: number
  lng: number
}

interface CustomMapProps extends MapProps {
  children: React.ReactNode
  center?: MapCenter
  showUserLocation?: boolean
  userLocation?: {
    latitude: number
    longitude: number
  }
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto'
  initialZoom?: number
}

const DEFAULT_CENTER = { lat: -34.603722, lng: -58.381557 }

export default function Map({
  children,
  center,
  showUserLocation = false,
  userLocation,
  gestureHandling = 'cooperative',
  initialZoom = 12,
  ...props
}: CustomMapProps) {
  const [mapCenter, setMapCenter] = useState<MapCenter>(DEFAULT_CENTER)
  const [forceCenter, setForceCenter] = useState<MapCenter | null>(null)
  const [lastCenter, setLastCenter] = useState<MapCenter | null>(null)
  const [forceZoom, setForceZoom] = useState<number | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID

  // Initialize map center
  useEffect(() => {
    const initialCenter = center || {
      lat: userLocation?.latitude || DEFAULT_CENTER.lat,
      lng: userLocation?.longitude || DEFAULT_CENTER.lng
    }
    setMapCenter(initialCenter)
  }, [center, userLocation])

  // Update map center when center prop changes - force center only if it's a real change
  useEffect(() => {
    if (center) {
      const newCenter = {
        lat: center.lat,
        lng: center.lng
      }

      // Only force center if the coordinates are actually different
      const isSignificantChange =
        !lastCenter ||
        Math.abs(newCenter.lat - lastCenter.lat) > 0.0001 ||
        Math.abs(newCenter.lng - lastCenter.lng) > 0.0001

      if (isSignificantChange) {
        setMapCenter(newCenter)
        setForceCenter(newCenter)
        setForceZoom(initialZoom)
        setLastCenter(newCenter)
      }
    }
  }, [center, lastCenter, initialZoom])

  // Update map center when user location changes - force center
  useEffect(() => {
    if (userLocation) {
      const newCenter = {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      }
      setMapCenter(newCenter)
      setForceCenter(newCenter)
      setForceZoom(initialZoom)
    }
  }, [userLocation, initialZoom])

  // Clear force center and zoom after a short delay to allow free movement
  useEffect(() => {
    if (forceCenter) {
      const timer = setTimeout(() => {
        setForceCenter(null)
        setForceZoom(null)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [forceCenter])

  if (!apiKey || !mapId) {
    return (
      <div className="bg-muted/50 flex h-full w-full items-center justify-center rounded-lg">
        <div className="p-6 text-center">
          <div className="text-destructive mb-2 text-lg font-semibold">
            Error de configuración de Google Maps
          </div>
          <div className="text-muted-foreground mb-4 text-sm">
            {!apiKey &&
              !mapId &&
              'Faltan NEXT_PUBLIC_GOOGLE_MAPS_API_KEY y NEXT_PUBLIC_GOOGLE_MAPS_ID'}
            {!apiKey && mapId && 'Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'}
            {apiKey && !mapId && 'Falta NEXT_PUBLIC_GOOGLE_MAPS_ID'}
          </div>
          <div className="text-muted-foreground text-xs">
            Solicita las credenciales al administrador del proyecto
          </div>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        {...(forceCenter
          ? { center: forceCenter }
          : { defaultCenter: mapCenter })}
        {...(forceZoom ? { zoom: forceZoom } : { defaultZoom: initialZoom })}
        gestureHandling={gestureHandling}
        disableDefaultUI={false}
        zoomControl={true}
        mapId={mapId}
        reuseMaps
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        className="h-full w-full"
        colorScheme={ColorScheme.LIGHT}
        {...props}
      >
        {showUserLocation && userLocation && (
          <UserMarker
            position={{
              lat: userLocation.latitude,
              lng: userLocation.longitude
            }}
            title="Tu ubicación"
          />
        )}
        {children}
      </GoogleMap>
    </APIProvider>
  )
}
