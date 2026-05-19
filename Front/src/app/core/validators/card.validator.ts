import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ──────────────────────────────────────────────────────────────
//  Algoritmo de Luhn — verificador estándar para números de tarjeta
// ──────────────────────────────────────────────────────────────

/**
 * Verifica si una cadena cumple con el algoritmo de Luhn.
 * Sólo se consideran los dígitos (espacios y guiones se descartan).
 *
 * Para UrbanCar EC se exige EXACTAMENTE 16 dígitos.
 */
export function isLuhnValid(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 16) return false;

  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (Number.isNaN(n)) return false;
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** Valida número de tarjeta (16 dígitos + Luhn). Acepta espacios visuales. */
export const tarjetaValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = (control.value as string | null | undefined)?.toString() ?? '';
  if (!raw.trim()) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 16) return { tarjetaLongitud: true };
  return isLuhnValid(digits) ? null : { tarjetaLuhn: true };
};

/**
 * Valida fecha de expiración MM/YY:
 *   - Formato exacto MM/YY.
 *   - Mes 01-12.
 *   - No anterior al mes/año actual (último día del mes inclusive).
 */
export const expiracionValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = (control.value as string | null | undefined)?.toString().trim() ?? '';
  if (!raw) return null;

  const m = /^(\d{2})\/(\d{2})$/.exec(raw);
  if (!m) return { expiraFormato: true };

  const mes  = parseInt(m[1] as string, 10);
  const anio = 2000 + parseInt(m[2] as string, 10);
  if (mes < 1 || mes > 12) return { expiraFormato: true };

  // Último día del mes a las 23:59:59
  const finMes = new Date(anio, mes, 0, 23, 59, 59);
  return finMes.getTime() < Date.now() ? { expiraExpirada: true } : null;
};

/** Valida CVV de 3 o 4 dígitos numéricos. */
export const cvvValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = (control.value as string | null | undefined)?.toString().trim() ?? '';
  if (!raw) return null;
  return /^\d{3,4}$/.test(raw) ? null : { cvv: true };
};

// ──────────────────────────────────────────────────────────────
//  Helpers para máscaras / formateo (sin dependencias externas)
// ──────────────────────────────────────────────────────────────

/** Inserta un espacio cada 4 dígitos: "4242424242424242" → "4242 4242 4242 4242". */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Aplica máscara MM/YY al ir tipeando dígitos. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
