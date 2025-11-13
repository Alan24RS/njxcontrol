import { randomUUID } from 'crypto'

export function generateValidUUID(): string {
  return randomUUID()
}

export function generateValidUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => randomUUID())
}

export function isValidRFC4122UUID(uuid: string): boolean {
  const version = parseInt(uuid[14], 16)
  const variant = parseInt(uuid[19], 16)

  return version >= 1 && version <= 5 && variant >= 8 && variant <= 11
}
