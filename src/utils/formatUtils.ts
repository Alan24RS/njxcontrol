export const getInitials = (name: string): string => {
  const [firstName, lastName] = name.split(' ')
  if (lastName) {
    return `${firstName[0]}${lastName[0]}`
  } else {
    return `${firstName[0]}${firstName[1] || ''}`
  }
}

export const formatDate = (date?: Date | string | null): string => {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '-'

  try {
    return d.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    // Fallback simple ISO date if toLocaleDateString fails in this environment
    return d.toISOString().slice(0, 10)
  }
}
