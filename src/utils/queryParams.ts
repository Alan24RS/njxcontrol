export function buildQueryParams<T extends Record<string, any>>(
  params?: T
): string {
  if (!params) return ''
  const queryParams = new URLSearchParams()

  // Iterar sobre las claves del objeto params
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key]

      if (value !== undefined) {
        // Si el valor es un array, agregamos cada elemento individualmente
        if (Array.isArray(value)) {
          value.forEach((val: string | number | boolean) => {
            queryParams.append(key, String(val))
          })
        } else {
          // Para otros tipos (boolean, string, number)
          queryParams.append(key, String(value))
        }
      }
    }
  }

  if (queryParams.toString() === '') return ''

  return `?${queryParams.toString()}`
}

export function formatParams<T>(params: {
  [key: string]: string | string[] | undefined
}): Partial<T> {
  const formattedParams: Partial<T> = {}

  // Parámetros que siempre deben ser arrays
  const arrayParams = new Set([
    'caracteristicas',
    'estado',
    'tipoPlaza',
    'ciudad'
  ])

  function formatValue(
    value: string | undefined
  ): string | number | boolean | undefined {
    if (typeof value === 'string') {
      if (value === 'true') return true
      if (value === 'false') return false
      const isInteger = /^-?\d+$/.test(value.trim())
      if (isInteger) {
        const parsedValue = parseInt(value, 10)
        return isNaN(parsedValue) ? value : parsedValue
      }
      return value
    }
    return undefined
  }

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key]

      if (arrayParams.has(key)) {
        // Forzar que sea array para ciertos parámetros
        if (Array.isArray(value)) {
          formattedParams[key as keyof T] = value.map((item) =>
            formatValue(item)
          ) as unknown as T[keyof T]
        } else {
          // Si es un solo valor, convertirlo a array
          formattedParams[key as keyof T] = [
            formatValue(value)
          ] as unknown as T[keyof T]
        }
      } else if (!Array.isArray(value)) {
        // Manejo de valores no array
        formattedParams[key as keyof T] = formatValue(value) as
          | T[keyof T]
          | undefined
      } else {
        // Manejo especial para arrays
        formattedParams[key as keyof T] = value.map((item) =>
          formatValue(item)
        ) as unknown as T[keyof T]
      }
    }
  }

  return formattedParams
}

export const generateTags = (params: { [key: string]: any }) => {
  return Object.entries(params)
    .filter((item) => item !== undefined)
    .map((item) => (Array.isArray(item) ? item.join() : item)) as string[]
}
