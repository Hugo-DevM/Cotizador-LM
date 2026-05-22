/** "YYYY-MM-DD" → "DD/MM/YYYY" */
export function formatDateMX(isoDate: string): string {
  if (!isoDate) return ''
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
