export const getCurrentYear = () => {
  return new Date().getFullYear()
}

export const parseLocalDate = (isoDate?: string | null): Date | undefined => {
  if (!isoDate) return undefined
  const s = String(isoDate).trim()
  const ymdOnly = /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (ymdOnly) {
    const [y, m, d] = s.split('-').map((n) => Number(n))
    if (!y || !m || !d) return undefined
    return new Date(y, m - 1, d)
  }

  const dmySlash = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  if (dmySlash) {
    const [, dd, mm, yyyy] = dmySlash
    const y = Number(yyyy)
    const m = Number(mm)
    const d = Number(dd)
    if (!y || !m || !d) return undefined
    return new Date(y, m - 1, d)
  }

  const dt = new Date(s)
  if (isNaN(dt.getTime())) return undefined

  const hasTime = /T/.test(s)
  if (hasTime) {
    return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
  }

  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
}
