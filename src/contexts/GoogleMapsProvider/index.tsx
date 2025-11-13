'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface GoogleMapsContextType {
  isLoaded: boolean
  isLoading: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  isLoading: false
})

export const useGoogleMaps = () => useContext(GoogleMapsContext)

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

export default function GoogleMapsProvider({
  children
}: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof window === 'undefined') return

      // Si ya está cargado, actualizar estado
      if (window.google?.maps?.places) {
        setIsLoaded(true)
        setIsLoading(false)
        return
      }

      // Si ya está cargando, no duplicar
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        setIsLoading(true)

        // Esperar a que se cargue
        const checkLoaded = () => {
          if (window.google?.maps?.places) {
            setIsLoaded(true)
            setIsLoading(false)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      if (!apiKey) {
        console.error('Google Maps API Key no está configurada')
        return
      }

      setIsLoading(true)

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initializeGoogleMaps`
      script.async = true
      script.defer = true

      // Callback global para cuando se carga Google Maps
      ;(window as any).initializeGoogleMaps = () => {
        setIsLoaded(true)
        setIsLoading(false)

        // Disparar evento custom para componentes que lo necesiten
        window.dispatchEvent(new CustomEvent('googleMapsLoaded'))
      }

      document.head.appendChild(script)

      script.onerror = () => {
        console.error('Error al cargar Google Maps API')
        setIsLoading(false)
      }
    }

    loadGoogleMaps()
  }, [])

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, isLoading }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
