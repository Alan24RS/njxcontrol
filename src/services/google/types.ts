export interface GooglePlaceResult {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

export interface GooglePlaceDetails {
  calle: string
  numero: string
  direccion: string
  latitud: number
  longitud: number
  formattedAddress: string
  ciudad: string
  provincia: string
}

export interface AutocompleteRequest {
  input: string
  sessionToken?: string
}

export interface PlaceDetailsRequest {
  placeId: string
  sessionToken?: string
}
