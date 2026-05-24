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
