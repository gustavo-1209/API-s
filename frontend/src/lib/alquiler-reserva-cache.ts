const STORAGE_KEY = 'rentwheels:alquiler-reserva-cache';

export interface AlquilerReservaCacheEntry {
  alquilerId: string;
  kmSalida?: number;
}

type AlquilerReservaCacheStore = Record<string, AlquilerReservaCacheEntry>;

function readStore(): AlquilerReservaCacheStore {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as AlquilerReservaCacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: AlquilerReservaCacheStore): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function guardarAlquilerEnCache(
  reservaId: string,
  alquilerId: string,
  kmSalida?: number,
): void {
  const id = reservaId.trim();
  const alquiler = alquilerId.trim();
  if (!id || !alquiler) return;

  const store = readStore();
  const entry: AlquilerReservaCacheEntry = { alquilerId: alquiler };
  if (kmSalida !== undefined && Number.isFinite(kmSalida)) {
    entry.kmSalida = kmSalida;
  }
  store[id] = entry;
  writeStore(store);
}

export function obtenerAlquilerDeCache(reservaId: string): AlquilerReservaCacheEntry | null {
  const id = reservaId.trim();
  if (!id) return null;
  const entry = readStore()[id];
  if (!entry?.alquilerId) return null;
  return entry;
}

export function eliminarAlquilerDeCache(reservaId: string): void {
  const id = reservaId.trim();
  if (!id) return;
  const store = readStore();
  if (!(id in store)) return;
  delete store[id];
  writeStore(store);
}
