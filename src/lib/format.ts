// Formateo de moneda centralizado. Ahora el default es Quetzales (GTQ) con locale es-GT.
// Se permiten overrides si en el futuro se requiere otra moneda.
export function formatCurrency(
  value: number,
  locale: string = 'es-GT',
  currency: string = 'GTQ',
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2,
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
