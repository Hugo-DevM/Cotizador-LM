export function formatMXN(value: number): string {
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function mxn(value: number): string {
  return `$${formatMXN(value)}`
}
