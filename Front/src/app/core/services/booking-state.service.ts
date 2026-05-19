import { computed, Injectable, signal } from '@angular/core';

import type { Extra, Seguro, Vehiculo } from '@core/models/api.models';
import { addDaysIso, diffDays, todayIso } from '@core/utils/date.utils';

/**
 * Criterios de búsqueda compartidos por Home → Marketplace → Reserva.
 * Persisten en `localStorage` para que el flujo sobreviva a recargas.
 */
export interface SearchCriteria {
  ciudadId: string | null;
  fechaInicio: string;   // YYYY-MM-DD
  fechaFin: string;      // YYYY-MM-DD
  horaRecogida: string;  // HH:mm
  horaDevolucion: string;
  categoriaId: string | null;
  tipoCombustibleId: string | null;
  tipoTransmisionId: string | null;
}

const STORAGE_KEY = 'urbancar.booking.criteria';

function defaultCriteria(): SearchCriteria {
  const start = todayIso();
  return {
    ciudadId: null,
    fechaInicio: start,
    fechaFin: addDaysIso(start, 3),
    horaRecogida: '10:00',
    horaDevolucion: '10:00',
    categoriaId: null,
    tipoCombustibleId: null,
    tipoTransmisionId: null,
  };
}

function loadCriteria(): SearchCriteria {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCriteria();
    const parsed = { ...defaultCriteria(), ...(JSON.parse(raw) as Partial<SearchCriteria>) };
    if (parsed.fechaInicio < todayIso()) return defaultCriteria();
    return parsed;
  } catch {
    return defaultCriteria();
  }
}

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  // ── Estado reactivo ─────────────────────────────────────────
  private readonly _criteria = signal<SearchCriteria>(loadCriteria());
  readonly criteria = this._criteria.asReadonly();

  /** Vehículo elegido al pulsar "Alquilar" en una tarjeta. */
  private readonly _vehiculo = signal<Vehiculo | null>(null);
  readonly vehiculo = this._vehiculo.asReadonly();

  /** Map<extraId, cantidad> seleccionada en el paso 2. */
  private readonly _extras = signal<Map<string, { extra: Extra; cantidad: number }>>(new Map());
  readonly extras = this._extras.asReadonly();

  /** Seguro seleccionado en el paso 2. `null` = sin seguro. */
  private readonly _seguro = signal<Seguro | null>(null);
  readonly seguro = this._seguro.asReadonly();

  // ── Derivados (cálculo PREVIEW; el backend recalcula el oficial) ─
  readonly dias = computed(() =>
    diffDays(this._criteria().fechaInicio, this._criteria().fechaFin),
  );

  readonly subtotalDias = computed(() => {
    const v = this._vehiculo();
    return v ? Number(v.precioDia) * this.dias() : 0;
  });

  readonly subtotalExtras = computed(() => {
    const dias = this.dias();
    let total = 0;
    for (const { extra, cantidad } of this._extras().values()) {
      total += Number(extra.precioDia) * dias * cantidad;
    }
    return total;
  });

  readonly subtotalSeguro = computed(() => {
    const s = this._seguro();
    return s ? Number(s.precioDia) * this.dias() : 0;
  });

  readonly total = computed(
    () => this.subtotalDias() + this.subtotalExtras() + this.subtotalSeguro(),
  );

  // ── Mutadores ───────────────────────────────────────────────

  setCriteria(partial: Partial<SearchCriteria>): void {
    const next = { ...this._criteria(), ...partial };
    this._criteria.set(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* no-op */ }
  }

  resetCriteria(): void {
    this._criteria.set(defaultCriteria());
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  }

  setVehiculo(v: Vehiculo | null): void { this._vehiculo.set(v); }

  toggleExtra(extra: Extra, cantidad: number): void {
    const map = new Map(this._extras());
    if (cantidad <= 0) {
      map.delete(extra.id);
    } else {
      map.set(extra.id, { extra, cantidad });
    }
    this._extras.set(map);
  }

  setSeguro(seguro: Seguro | null): void { this._seguro.set(seguro); }

  /** Reinicia extras, seguro y vehículo. Útil al confirmar/cancelar reserva. */
  clearSelection(): void {
    this._vehiculo.set(null);
    this._extras.set(new Map());
    this._seguro.set(null);
  }
}
