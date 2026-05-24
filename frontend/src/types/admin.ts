/** Mapas id → nombre para enriquecer vehículos. */
export interface AdminCatalogMaps {
  marcas: Map<string, string>;
  modelos: Map<string, string>;
  categorias: Map<string, string>;
  agencias: Map<string, string>;
}

export const EMPTY_CATALOG_MAPS: AdminCatalogMaps = {
  marcas: new Map(),
  modelos: new Map(),
  categorias: new Map(),
  agencias: new Map(),
};

/** Fila normalizada: vehículos (admin). */
export interface AdminVehiculoRow {
  id: string;
  nombre: string;
  placa: string;
  marca: string;
  modelo: string;
  categoria: string;
  precioPorDia: string;
  estado: string;
  imagenUrl: string | null;
  /** Etiqueta compacta para tablas relacionadas (nombre + placa). */
  displayLabel: string;
}

/** Fila normalizada: reservas (admin). */
export interface AdminReservaRow {
  id: string;
  codigo: string;
  vehiculo: string;
  cliente: string;
  fechaInicio: string;
  fechaFin: string;
  total: string;
  estado: string;
  /** Presente si el backend o GET /alquileres lo expone para la reserva. */
  alquilerId?: string;
  kmSalida?: number;
}

/** Fila genérica para listados financieros y operativos. */
export interface AdminTableRow {
  id: string;
  [key: string]: string;
}

export interface AdminDashboardStats {
  totalVehiculos: number;
  vehiculosDisponibles: number;
  totalReservas: number;
  totalPagos: number;
  totalMantenimientos: number;
}

/** Body de POST /alquileres (Booking Gateway). */
export interface CrearAlquilerRequest {
  reservaId: string;
  kmSalida: number;
  fechaInicio?: string;
  observaciones?: string;
}

/** Respuesta de POST /alquileres. */
export interface CrearAlquilerResponse {
  id: string;
  reservaId?: string;
  kmSalida?: number;
  fechaInicio?: string;
  status?: string;
  observaciones?: string | null;
}

export type EstadoVehiculoDevolucion = 'BUENO' | 'REGULAR' | 'MALO';

/** Body de POST /devoluciones (Booking Gateway). */
export interface RegistrarDevolucionRequest {
  alquilerId: string;
  kmEntrada: number;
  estadoVehiculo: EstadoVehiculoDevolucion;
  cargoExtra?: number;
  observaciones?: string;
}

/** Respuesta de POST /devoluciones. */
export interface RegistrarDevolucionResponse {
  id: string;
  alquilerId?: string;
  kmEntrada?: number;
  estadoVehiculo?: string;
  cargoExtra?: number;
  observaciones?: string | null;
}

/** Metadatos de alquiler vinculados a una reserva (admin). */
export interface AdminReservaAlquilerMeta {
  alquilerId: string;
  kmSalida?: number;
}
