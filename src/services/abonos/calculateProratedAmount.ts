export function getDaysInMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  return new Date(year, month + 1, 0).getDate()
}

export function getDaysUntilEndOfMonth(date: Date): number {
  const dayOfMonth = date.getDate()
  const daysInMonth = getDaysInMonth(date)
  return daysInMonth - dayOfMonth + 1
}

export function calculateProratedAmount(
  tarifaMensual: number,
  fechaInicio: Date
): number {
  const daysInMonth = getDaysInMonth(fechaInicio)
  const daysUntilEndOfMonth = getDaysUntilEndOfMonth(fechaInicio)

  const montoProrrateo = (tarifaMensual / daysInMonth) * daysUntilEndOfMonth

  return Number(montoProrrateo.toFixed(2))
}
