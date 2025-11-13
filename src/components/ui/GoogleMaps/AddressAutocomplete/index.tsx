'use client'

import { useEffect, useId, useState } from 'react'

import { useDebounce } from 'use-debounce'

import { FormMessage } from '@/components/ui/form'
import Map from '@/components/ui/GoogleMaps/Map'
import PlayaMarker from '@/components/ui/GoogleMaps/PlayaMarker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGoogleMaps } from '@/contexts/GoogleMapsProvider'
import {
  type GooglePlaceDetails,
  type GooglePlaceResult,
  googlePlacesService
} from '@/services/google'

interface AddressAutocompleteProps {
  onAddressSelect: (details: GooglePlaceDetails) => void
  onAddressClear?: () => void
  placeholder?: string
  label?: string
  error?: string
  displayAddress?: string
  latitude?: number
  longitude?: number
}

export default function AddressAutocomplete({
  onAddressSelect,
  onAddressClear,
  placeholder = 'Buscar dirección...',
  label = 'Dirección',
  error,
  displayAddress,
  latitude,
  longitude
}: AddressAutocompleteProps) {
  const [searchValue, setSearchValue] = useState(displayAddress || '')
  const [debouncedSearchValue] = useDebounce(searchValue, 300)
  const inputId = useId()
  const [predictions, setPredictions] = useState<GooglePlaceResult[]>([])
  const [selectedAddress, setSelectedAddress] =
    useState<GooglePlaceDetails | null>(null)
  const [originalAddress, setOriginalAddress] =
    useState<GooglePlaceDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAddressSelected, setIsAddressSelected] = useState(false)

  const { isLoaded: isGoogleLoaded } = useGoogleMaps()

  useEffect(() => {
    if (isGoogleLoaded) {
      googlePlacesService.initializeServices()
    }
  }, [isGoogleLoaded])

  // Reconstruir selectedAddress cuando se tienen las coordenadas del formulario
  useEffect(() => {
    if (
      displayAddress &&
      latitude &&
      longitude &&
      latitude !== 0 &&
      longitude !== 0 &&
      !selectedAddress
    ) {
      const addressDetails = {
        formattedAddress: displayAddress,
        latitud: latitude,
        longitud: longitude,
        calle: '',
        numero: '',
        direccion: '',
        ciudad: '',
        provincia: ''
      }
      setSelectedAddress(addressDetails)
      setOriginalAddress(addressDetails)
      setIsAddressSelected(true)
    }
  }, [displayAddress, latitude, longitude, selectedAddress])

  useEffect(() => {
    if (!isGoogleLoaded || !debouncedSearchValue.trim() || isAddressSelected) {
      if (!debouncedSearchValue.trim()) {
        setPredictions([])
        setShowDropdown(false)
      }
      return
    }

    const fetchPredictions = async () => {
      setIsLoading(true)
      try {
        const results = await googlePlacesService.getAutocompletePredictions({
          input: debouncedSearchValue
        })
        setPredictions(results)
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('Error fetching predictions:', error)
        setPredictions([])
        setShowDropdown(false)
      } finally {
        setIsLoading(false)
      }
    }
    if (debouncedSearchValue.trim() !== displayAddress) {
      fetchPredictions()
    }
  }, [debouncedSearchValue, isGoogleLoaded, isAddressSelected, displayAddress])

  const handleSelectPlace = async (placeId: string) => {
    if (!placeId) return

    try {
      setIsLoading(true)
      const placeDetails = await googlePlacesService.getPlaceDetails({
        placeId
      })

      const selectedPrediction = predictions.find((p) => p.placeId === placeId)
      if (selectedPrediction) {
        setSearchValue(selectedPrediction.description)
        setSelectedAddress(placeDetails)
        setOriginalAddress(placeDetails)
        setIsAddressSelected(true)
      }

      onAddressSelect(placeDetails)
      setPredictions([])
      setShowDropdown(false)
    } catch (error) {
      console.error('Error getting place details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSearchValue(value)
    setIsAddressSelected(false)
    setShowDropdown(true)
    googlePlacesService.generateNewSessionToken()

    // Si se borra el contenido, llamar al callback de limpieza
    if (!value.trim() && onAddressClear) {
      setSelectedAddress(null)
      setOriginalAddress(null)
      onAddressClear()
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-address-autocomplete]')) {
        setShowDropdown(false)

        // Si el usuario editó el input pero no seleccionó ninguna opción,
        // volver al valor original (displayAddress)
        if (
          !isAddressSelected &&
          originalAddress &&
          searchValue !== originalAddress.formattedAddress
        ) {
          setSearchValue(originalAddress.formattedAddress)
          setSelectedAddress(originalAddress)
          setIsAddressSelected(true)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAddressSelected, searchValue, originalAddress])

  if (!isGoogleLoaded) {
    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} data-error={!!error}>
          {label}
        </Label>
        <div className="relative">
          <Input
            id={inputId}
            name={inputId}
            placeholder={placeholder}
            disabled
            className="pr-10 opacity-50"
            autoComplete="off"
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <div className="border-muted border-t-foreground h-4 w-4 animate-spin rounded-full border-2" />
          </div>
        </div>
        {error && <FormMessage>{error}</FormMessage>}
      </div>
    )
  }

  return (
    <div className="space-y-4" data-address-autocomplete>
      <div className="space-y-2">
        <Label htmlFor={inputId} data-error={!!error}>
          {label}
        </Label>
        <div className="relative">
          <Input
            id={inputId}
            name={inputId}
            value={searchValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (!isAddressSelected && predictions.length > 0) {
                setShowDropdown(true)
              }
            }}
            onBlur={() => {
              // Usar setTimeout para permitir que el click en el dropdown funcione
              setTimeout(() => {
                setShowDropdown(false)
                // Si el usuario editó el input pero no seleccionó ninguna opción,
                // volver al valor original
                if (
                  !isAddressSelected &&
                  originalAddress &&
                  searchValue !== originalAddress.formattedAddress
                ) {
                  setSearchValue(originalAddress.formattedAddress)
                  setSelectedAddress(originalAddress)
                  setIsAddressSelected(true)
                }
              }, 150)
            }}
            placeholder={placeholder}
            className={`${error ? 'border-destructive' : ''} ${isLoading ? 'pr-10' : ''}`}
            autoComplete="off"
          />

          {showDropdown && predictions.length > 0 && (
            <div className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full rounded-md border p-0 shadow-md">
              <div className="max-h-60 overflow-auto p-1">
                {predictions.map((prediction) => (
                  <div
                    key={prediction.placeId}
                    className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none"
                    onClick={() => handleSelectPlace(prediction.placeId)}
                  >
                    <div>
                      <div className="font-medium">{prediction.mainText}</div>
                      <div className="text-muted-foreground text-xs">
                        {prediction.secondaryText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <div className="border-muted border-t-foreground h-4 w-4 animate-spin rounded-full border-2" />
            </div>
          )}
        </div>

        {error && <FormMessage>{error}</FormMessage>}
      </div>

      {selectedAddress && (
        <div className="h-80 w-full overflow-hidden rounded-lg">
          <Map
            center={{
              lat: selectedAddress.latitud,
              lng: selectedAddress.longitud
            }}
          >
            <PlayaMarker
              position={{
                lat: selectedAddress.latitud,
                lng: selectedAddress.longitud
              }}
              title={selectedAddress.formattedAddress}
            />
          </Map>
        </div>
      )}
    </div>
  )
}
