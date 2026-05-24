const STORAGE_KEY = 'rw:alquiler-por-reserva';

interface CacheEntry {
  alquilerId: string;
  kmSalida?: number;
}

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage no disponible o cuota llena
  }
}

export function guardarAlquilerEnCache(
  reservaId: string,
  alquilerId: string,
  kmSalida?: number,
): void {
  const cache = readCache();
  cache[reservaId] = { alquilerId, kmSalida };
  writeCache(cache);
}

export function obtenerAlquilerDesdeCache(
  reservaId: string,
): CacheEntry | undefined {
  return readCache()[reservaId];
}

export function leerIndiceAlquilerDesdeCache(): Map<string, CacheEntry> {
  const cache = readCache();
  return new Map(Object.entries(cache));
}
