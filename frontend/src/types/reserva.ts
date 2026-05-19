/** Modelo del formulario Vue (camelCase). */
export interface ReservaFormModel {
  clienteId: string;
  vehiculoId: string;
  agenciaId: string;
  fechaInicio: string;
  fechaFin: string;
  total: number;
}

/** Payload estricto snake_case exigido por el contrato de persistencia. */
export interface ReservaSnakePayload {
  cli_id: string;
  veh_id: string;
  age_id: string;
  res_fecha_inicio: string;
  res_fecha_fin: string;
  res_total: number;
}

/** Body que acepta operaciones-service (REST camelCase). */
export interface ReservaCreateApiBody {
  vehiculoId: string;
  agenciaId: string;
  fechaInicio: string;
  fechaFin: string;
  notas?: string;
}

export interface ReservaApiError {
  code?: string;
  message?: string;
}

export interface ReservaApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ReservaApiError;
  message?: string;
}

export interface ReservaCreada {
  id: string;
  codigoReserva?: string;
  totalAmount?: number | string;
  status?: string;
}
