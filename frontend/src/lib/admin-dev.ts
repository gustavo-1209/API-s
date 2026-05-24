/** En desarrollo: imprime solo las keys del primer registro (sin datos sensibles). */
export function logApiKeysInDev(endpoint: string, list: unknown[]): void {
  if (!import.meta.env.DEV || list.length === 0) return;

  const first = list[0];
  if (first === null || typeof first !== 'object') {
    console.log(`[admin] ${endpoint}:`, typeof first);
    return;
  }

  console.log(`[admin] ${endpoint} keys:`, Object.keys(first as Record<string, unknown>));
}
