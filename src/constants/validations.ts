// src/constants/validation.ts

// Regex para validar DNI argentino (7 u 8 dígitos)
export const dniRegex = /^\d{7,8}$/

// Regex para validar teléfonos argentinos
export const phoneRegex =
  /^(?:(?:00)?\+?54|0)?\s*(?:(?:11|[2368]\d)\s*)?(?:4|5|6|7|8|9)(?:\d\s*){7}$/

// Regex para validar solo letras y espacios (nombres y apellidos)
export const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/
