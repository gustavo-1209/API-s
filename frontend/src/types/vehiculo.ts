/** Estado del vehículo según inventario-service (Prisma enum vehicle_status). */
export type VehiculoStatus =
  | 'DISPONIBLE'
  | 'EN_USO'
  | 'MANTENIMIENTO'
  | 'RESERVADO'
  | 'INACTIVO';

/** Marca anidada en la respuesta del marketplace. */
export interface Marca {
  id: string;
  nombre: string;
  logoUrl?: string | null;
}

/** Modelo anidado con marca. */
export interface Modelo {
  id: string;
  nombre: string;
  marcaId?: string;
  marca?: Marca | null;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
}

/**
 * Vehículo tal como lo devuelve inventario-service (Prisma → JSON camelCase).
 * Campos alineados con el schema y GET /vehiculos/marketplace.
 */
export interface Vehiculo {
  id: string;
  agenciaId?: string | null;
  modeloId?: string | null;
  categoriaId?: string | null;
  tipoCombustibleId?: string | null;
  tipoTransmisionId?: string | null;
  placa: string | null;
  color?: string | null;
  anio?: number | null;
  kilometraje?: number | null;
  numeroPasajeros?: number | null;
  precioDia: string | number | null;
  imagenUrl?: string | null;
  descripcion?: string | null;
  status?: VehiculoStatus | null;
  isActive?: boolean | null;
  modelo?: Modelo | null;
  categoria?: Categoria | null;
}

/** Respuesta estándar del backend RentWheels (bus-service). */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** Detalle de vehículo normalizado para reserva (Booking Gateway). */
export interface VehiculoMarketplace {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precioPorDia: number;
  moneda?: string | null;
  categoria?: string | null;
  agenciaId?: string | null;
  disponible?: boolean;
  status?: string | null;
  imagenUrl?: string | null;
  placa?: string | null;
}

/** Vista del catálogo: datos normalizados para la UI. */
export interface VehiculoCard {
  id: string;
  placa: string;
  modeloLabel: string;
  precioDia: number;
  imagenUrl: string | null;
  status: VehiculoStatus;
}
