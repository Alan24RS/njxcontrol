export const ROL = {
  DUENO: 'DUENO',
  PLAYERO: 'PLAYERO'
} as const

export type Role = keyof typeof ROL
