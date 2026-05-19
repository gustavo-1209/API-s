import type {
  ReservaCreateApiBody,
  ReservaFormModel,
  ReservaSnakePayload,
} from '@/types/reserva';

/** Formulario Vue → snake_case (contrato de BD / integración). */
export function mapReservaFormToSnakeCase(form: ReservaFormModel): ReservaSnakePayload {
  return {
    cli_id: form.clienteId,
    veh_id: form.vehiculoId,
    age_id: form.agenciaId,
    res_fecha_inicio: form.fechaInicio,
    res_fecha_fin: form.fechaFin,
    res_total: form.total,
  };
}

/** snake_case → body REST de operaciones-service. */
export function mapSnakeToReservaCreateBody(payload: ReservaSnakePayload): ReservaCreateApiBody {
  return {
    vehiculoId: payload.veh_id,
    agenciaId: payload.age_id,
    fechaInicio: payload.res_fecha_inicio,
    fechaFin: payload.res_fecha_fin,
    notas: `Total estimado: ${payload.res_total.toFixed(2)} USD`,
  };
}

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
