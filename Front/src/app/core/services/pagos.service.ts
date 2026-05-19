import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '@env/environment';
import type {
  ApiSuccess,
  CreatePagoRequest,
  Pago,
  PagoClienteResponse,
} from '@core/models/api.models';

/**
 * Servicio del módulo de Pagos.
 *
 * Endpoint principal: `POST /api/v1/pagos`
 *   - Recibe los datos del pago + tarjeta validada + datos de facturación.
 *   - El backend ejecuta la TX atómica (pago + factura persistidos).
 *   - Respuesta al cliente: solo `{ message }` (sin factura en JSON).
 */
@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;

  /** Procesa el pago; la factura queda solo en backend / admin. */
  create(payload: CreatePagoRequest): Observable<PagoClienteResponse> {
    return this.http
      .post<ApiSuccess<PagoClienteResponse>>(`${this.api}/pagos`, payload)
      .pipe(map((r) => r.data));
  }

  /** Detalle de un pago (admin o dueño de la reserva). */
  getById(id: string): Observable<Pago> {
    return this.http
      .get<ApiSuccess<Pago>>(`${this.api}/pagos/${id}`)
      .pipe(map((r) => r.data));
  }
}
