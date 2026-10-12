// Currency utilities for Brazilian Real (BRL)

/**
 * Formats a value in integer cents to Brazilian Real string (e.g. 4500 -> "R$ 45,00")
 */
export function formatBRL(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) {
    return 'R$ 0,00';
  }
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/**
 * Parses user input currency string to integer cents (e.g. "45,50" -> 4550)
 */
export function parseBRLToCents(input: string): number {
  if (!input) return 0;
  // Remove non-numeric characters except comma or period
  const clean = input.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
