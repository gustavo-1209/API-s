/** Formatea una `Date` como `YYYY-MM-DD` (zona local, sin offset). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Hoy en formato `YYYY-MM-DD` (útil para `min` de inputs date). */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Suma `days` días a una fecha ISO `YYYY-MM-DD` y devuelve ISO. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

/**
 * Diferencia en días entre dos fechas ISO `YYYY-MM-DD`.
 * Mínimo 1 (un día completo de alquiler) si las fechas son válidas.
 */
export function diffDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  const ms = b.getTime() - a.getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.max(1, Math.round(ms / 86_400_000));
}

/** `true` si la fecha ISO es estrictamente anterior a hoy (zona local). */
export function isPast(iso: string): boolean {
  return iso < todayIso();
}

/** Formato visual largo en español: `mar 03 jun 2025`. */
export function formatLong(iso: string): string {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  return dt.toLocaleDateString('es-EC', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formatea moneda en USD (Ecuador). */
export function formatUsd(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}
