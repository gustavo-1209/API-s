/** Extrae el payload de respuestas `{ data }` o `{ data: { data } }`. */
export function unwrapApiData<T>(body: unknown): T {
  if (body === null || typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if ('data' in record && record.data !== undefined && record.data !== null) {
      const nested = record.data;
      if (typeof nested === 'object' && nested !== null && 'data' in nested) {
        return (nested as { data: T }).data;
      }
      return nested as T;
    }
  }

  if (body === null || typeof body !== 'object') {
    throw new Error('Respuesta inválida del servidor.');
  }

  return body as T;
}

/** Extrae listas: array directo, `{ data: [] }`, `{ success, data: [] }` o paginado `{ data: { data: [] } }`. */
export function unwrapApiList<T>(body: unknown): T[] {
  const payload = unwrapApiData<unknown>(body);

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as T[];
    if (Array.isArray(record.items)) return record.items as T[];
  }

  return [];
}
