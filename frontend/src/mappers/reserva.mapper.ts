export function calcularDiasReserva(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const ms = fin.getTime() - inicio.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function calcularTotalReserva(precioDia: number, dias: number): number {
  if (!Number.isFinite(precioDia) || dias <= 0) return 0;
  return Math.round(precioDia * dias * 100) / 100;
}
