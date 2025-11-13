/**
 * Utilidades para trabajar con FormData de manera type-safe
 */

/**
 * Convierte un objeto JavaScript a FormData de manera segura.
 * Maneja valores nulos/undefined, números, booleanos y arrays.
 *
 * @param data - Objeto a convertir
 * @param options - Opciones de conversión
 * @returns FormData construido a partir del objeto
 *
 * @example
 * ```ts
 * const data = {
 *   name: 'John',
 *   age: 30,
 *   active: true,
 *   metadata: null
 * }
 * const formData = objectToFormData(data, { skipNull: true })
 * ```
 */
export function objectToFormData<T extends Record<string, unknown>>(
  data: T,
  options: {
    /** Omitir campos con valor null o undefined */
    skipNull?: boolean
    /** Omitir campos con strings vacíos */
    skipEmpty?: boolean
    /** Transformar claves (ej: camelCase a snake_case) */
    transformKey?: (key: string) => string
  } = {}
): FormData {
  const { skipNull = false, skipEmpty = false, transformKey } = options
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    // Skip null/undefined si está configurado
    if (skipNull && (value === null || value === undefined)) {
      return
    }

    // Skip strings vacíos si está configurado
    if (skipEmpty && value === '') {
      return
    }

    const finalKey = transformKey ? transformKey(key) : key

    // Manejar diferentes tipos de valores
    if (value === null || value === undefined) {
      formData.append(finalKey, '')
    } else if (typeof value === 'boolean') {
      formData.append(finalKey, value.toString())
    } else if (typeof value === 'number') {
      formData.append(finalKey, value.toString())
    } else if (value instanceof Date) {
      formData.append(finalKey, value.toISOString())
    } else if (value instanceof File || value instanceof Blob) {
      formData.append(finalKey, value)
    } else if (Array.isArray(value)) {
      // Para arrays, agregar múltiples entries con el mismo key
      value.forEach((item) => {
        if (item !== null && item !== undefined) {
          formData.append(finalKey, String(item))
        }
      })
    } else if (typeof value === 'object') {
      // Serializar objetos a JSON, con manejo de errores.
      let serialized: string
      try {
        serialized = JSON.stringify(value)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          throw new Error(
            `objectToFormData: No se pudo serializar el objeto en key "${key}". ` +
              `Error: ${err}. Considera evitar referencias circulares o serializar manualmente.`
          )
        } else {
          serialized = ''
        }
      }
      if (serialized === undefined) {
        if (process.env.NODE_ENV === 'development') {
          throw new Error(
            `objectToFormData: JSON.stringify devolvió undefined para key "${key}". ` +
              `Considera serializar manualmente este valor.`
          )
        } else {
          serialized = ''
        }
      }
      formData.append(finalKey, serialized)
    } else {
      formData.append(finalKey, String(value))
    }
  })

  return formData
}

/**
 * Convierte FormData a un objeto JavaScript plano.
 * Útil para debugging o tests.
 *
 * @param formData - FormData a convertir
 * @returns Objeto con los valores del FormData
 *
 * @example
 * ```ts
 * const formData = new FormData()
 * formData.append('name', 'John')
 * const obj = formDataToObject(formData)
 * // { name: 'John' }
 * ```
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    // Si la clave ya existe, convertir a array
    if (key in obj) {
      const existing = obj[key]
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        obj[key] = [existing, value]
      }
    } else {
      obj[key] = value
    }
  })

  return obj
}
