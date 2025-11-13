import type {
  AutocompleteRequest,
  GooglePlaceDetails,
  GooglePlaceResult,
  PlaceDetailsRequest
} from './types'

class GooglePlacesService {
  private sessionToken: google.maps.places.AutocompleteSessionToken | null =
    null

  constructor() {
    if (typeof window !== 'undefined' && window.google) {
      this.initServices()
    }
  }

  private initServices() {
    if (window.google?.maps?.places) {
      this.sessionToken = new google.maps.places.AutocompleteSessionToken()
    }
  }

  public initializeServices() {
    this.initServices()
  }

  public async getAutocompletePredictions(
    request: AutocompleteRequest
  ): Promise<GooglePlaceResult[]> {
    if (!window.google?.maps?.places?.AutocompleteSuggestion) {
      throw new Error('Google Places AutocompleteSuggestion not available')
    }

    try {
      const { suggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          {
            input: request.input,
            sessionToken: this.sessionToken || undefined,
            includedRegionCodes: ['ar']
          }
        )

      const results: GooglePlaceResult[] = suggestions
        .filter((suggestion) => suggestion.placePrediction)
        .map((suggestion) => {
          const placePrediction = suggestion.placePrediction!
          return {
            placeId: placePrediction.placeId,
            description: placePrediction.text.text,
            mainText: placePrediction.text.text,
            secondaryText: ''
          }
        })

      return results
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error)
      return []
    }
  }

  public async getPlaceDetails(
    request: PlaceDetailsRequest
  ): Promise<GooglePlaceDetails> {
    if (!window.google?.maps?.places?.Place) {
      throw new Error('Google Places Place API not available')
    }

    try {
      const place = new google.maps.places.Place({
        id: request.placeId
      })

      const { place: placeResult } = await place.fetchFields({
        fields: ['addressComponents', 'location', 'formattedAddress']
      })

      const addressComponents = placeResult.addressComponents || []

      const streetNumber =
        addressComponents.find((c) => c.types.includes('street_number'))
          ?.longText || ''

      const streetName =
        addressComponents.find((c) => c.types.includes('route'))?.longText || ''

      const ciudad =
        addressComponents.find(
          (c) =>
            c.types.includes('locality') ||
            c.types.includes('administrative_area_level_2')
        )?.longText || ''

      const provincia =
        addressComponents.find((c) =>
          c.types.includes('administrative_area_level_1')
        )?.longText || ''

      const latitud = placeResult.location?.lat() || 0
      const longitud = placeResult.location?.lng() || 0

      const direccionCompleta = streetNumber
        ? `${streetName} ${streetNumber}`.trim()
        : streetName

      const result: GooglePlaceDetails = {
        calle: streetName,
        numero: streetNumber,
        direccion: direccionCompleta,
        latitud,
        longitud,
        formattedAddress: placeResult.formattedAddress || '',
        ciudad,
        provincia
      }

      this.resetSessionToken()
      return result
    } catch (error) {
      console.error('Error getting place details:', error)
      throw new Error('Failed to get place details')
    }
  }

  private resetSessionToken() {
    if (window.google?.maps?.places) {
      this.sessionToken = new google.maps.places.AutocompleteSessionToken()
    }
  }

  public generateNewSessionToken() {
    this.resetSessionToken()
  }
}

export const googlePlacesService = new GooglePlacesService()
