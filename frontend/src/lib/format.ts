/** Fecha legible en español (Ecuador). */
export function formatDisplayDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' || typeof value === 'number' ? value : String(value));

  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }

  return '—';
}

/** Monto en USD (o moneda indicada). */
export function formatDisplayMoney(value: unknown, currency = 'USD'): string {
  if (value === null || value === undefined || value === '') return '—';

  let amount: number | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    amount = value;
  } else if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    amount = Number.isFinite(parsed) ? parsed : null;
  }

  if (amount === null) return '—';

  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
