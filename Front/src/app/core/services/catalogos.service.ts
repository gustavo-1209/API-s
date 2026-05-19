import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '@env/environment';
import type {
  ApiSuccess,
  CanalVenta,
  Categoria,
  Ciudad,
  EstadoVehiculo,
  Extra,
  Marca,
  Modelo,
  Provincia,
  Seguro,
  Tarifa,
  TipoCombustible,
  TipoTransmision,
} from '@core/models/api.models';

/**
 * Catálogos de referencia (`/api/v1/<recurso>`).
 * Endpoints públicos, no requieren JWT.
 */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly api  = environment.apiUrl;

  provincias():       Observable<Provincia[]>       { return this.list<Provincia>('/provincias'); }
  ciudades():         Observable<Ciudad[]>          { return this.list<Ciudad>('/ciudades'); }
  marcas():           Observable<Marca[]>           { return this.list<Marca>('/marcas'); }
  modelos():          Observable<Modelo[]>          { return this.list<Modelo>('/modelos'); }
  categorias():       Observable<Categoria[]>       { return this.list<Categoria>('/categorias'); }
  tiposCombustible(): Observable<TipoCombustible[]> { return this.list<TipoCombustible>('/tipos-combustible'); }
  tiposTransmision(): Observable<TipoTransmision[]> { return this.list<TipoTransmision>('/tipos-transmision'); }
  estadosVehiculo(): Observable<EstadoVehiculo[]>   { return this.list<EstadoVehiculo>('/estados-vehiculo'); }
  extras():           Observable<Extra[]>           { return this.list<Extra>('/extras'); }
  seguros():          Observable<Seguro[]>          { return this.list<Seguro>('/seguros'); }
  tarifas():          Observable<Tarifa[]>          { return this.list<Tarifa>('/tarifas'); }
  canalesVenta():     Observable<CanalVenta[]>      { return this.list<CanalVenta>('/canales-venta'); }

  private list<T>(path: string): Observable<T[]> {
    return this.http
      .get<ApiSuccess<T[]>>(`${this.api}${path}`)
      .pipe(map((r) => r.data ?? []));
  }
}
