import { useEffect, useState } from 'react'

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface GeolocationState {
  isLoading: boolean
  isError: boolean
  error?: GeolocationPositionError
  location?: {
    latitude: number
    longitude: number
  }
}

interface UseGeolocationProps {
  askGeolocation?: boolean
  options?: GeolocationOptions
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
}

export function useGeolocation({
  askGeolocation = false,
  options = DEFAULT_OPTIONS
}: UseGeolocationProps = {}): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    isLoading: false,
    isError: false,
    error: undefined,
    location: undefined
  })

  useEffect(() => {
    if (!askGeolocation) {
      setState({
        isLoading: false,
        isError: false,
        error: undefined,
        location: undefined
      })
      return
    }

    if (!navigator.geolocation) {
      setState({
        isLoading: false,
        isError: true,
        error: {
          code: 2,
          message: 'Geolocation is not supported by this browser.'
        } as GeolocationPositionError,
        location: undefined
      })
      return
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: undefined
    }))

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        isLoading: false,
        isError: false,
        error: undefined,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      })
    }

    const handleError = (error: GeolocationPositionError) => {
      setState({
        isLoading: false,
        isError: true,
        error,
        location: undefined
      })
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      ...DEFAULT_OPTIONS,
      ...options
    })
  }, [askGeolocation, options])

  return state
}
