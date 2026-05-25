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

/** Índice reservaId → alquiler activo (admin). */
export interface AdminAlquilerActivoIndex {
  alquilerId: string;
  kmSalida: number | null;
}

export type EstadoVehiculoDevolucion = 'BUENO' | 'REGULAR' | 'MALO';

/** Body POST {bookingApi}/alquileres */
export interface IniciarAlquilerRequest {
  reservaId: string;
  kmSalida: number;
  fechaInicio: string;
  observaciones?: string;
}

export interface IniciarAlquilerResponse {
  id: string;
  reservaId: string;
  kmSalida?: number;
  status?: string;
}

/** Body POST {bookingApi}/devoluciones */
export interface RegistrarDevolucionRequest {
  alquilerId: string;
  kmEntrada: number;
  estadoVehiculo: EstadoVehiculoDevolucion;
  cargoExtra?: number;
  observaciones?: string;
}

export interface RegistrarDevolucionResponse {
  id: string;
  alquilerId?: string;
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
  /** Alquiler ACTIVO asociado (API admin o caché de sesión). */
  alquilerId?: string | null;
  kmSalida?: number | null;
}

/** Pago normalizado para detalle de reserva (admin). */
export interface AdminPago {
  id: string;
  referencia: string;
  monto: string;
  metodo: string;
  fecha: string;
  estado: string;
}

/** Factura normalizada para detalle de reserva (admin). */
export interface AdminFactura {
  id: string;
  numero: string;
  cliente: string;
  subtotal: string;
  total: string;
  fecha: string;
  estado: string;
}

/** Resumen de GET /booking/payment/{reservaId}. */
export interface ResumenPagoReserva {
  reservaId: string;
  status: string;
  statusLabel: string;
  totalPagado: string;
  cantidadPagos: number;
}

/** Detalle administrativo de una reserva (solo lectura). */
export interface ReservaDetalleAdmin {
  reserva: AdminReservaRow;
  resumenPago: ResumenPagoReserva | null;
  resumenPagoError: string | null;
  pagos: AdminPago[];
  pagosError: string | null;
  facturas: AdminFactura[];
  facturasError: string | null;
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
