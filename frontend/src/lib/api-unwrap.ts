/** Extrae el payload de respuestas `{ data }` o `{ data: { data } }`. */
export function unwrapApiData<T>(body: unknown): T {
  if (body === null || typeof body !== 'object') {
    throw new Error('Respuesta inválida del servidor.');
  }

  const record = body as Record<string, unknown>;

  if ('data' in record && record.data !== undefined && record.data !== null) {
    const nested = record.data;
    if (typeof nested === 'object' && nested !== null && 'data' in nested) {
      return (nested as { data: T }).data;
    }
    return nested as T;
  }

  return body as T;
}

export function unwrapApiList<T>(body: unknown): T[] {
  const data = unwrapApiData<unknown>(body);
  return Array.isArray(data) ? (data as T[]) : [];
}
