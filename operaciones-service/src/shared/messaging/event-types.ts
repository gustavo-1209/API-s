export const RENTWHEELS_EVENT_TYPES = {
  RESERVA_CREADA: 'reserva.creada',
  RESERVA_CONFIRMADA: 'reserva.confirmada',
  RESERVA_CANCELADA: 'reserva.cancelada',
  VEHICULO_RESERVADO: 'vehiculo.reservado',
  VEHICULO_LIBERADO: 'vehiculo.liberado',
} as const;

export type RentWheelsEventType =
  (typeof RENTWHEELS_EVENT_TYPES)[keyof typeof RENTWHEELS_EVENT_TYPES];

export interface RentWheelsEvent {
  eventId: string;
  eventType: RentWheelsEventType;
  routingKey: RentWheelsEventType;
  occurredAt: string;
  correlationId: string;
  source: string;
  payload: Record<string, unknown>;
}

export interface ReservaBookingEventPayload {
  reservaId: string;
  vehiculoId: string;
  clienteId: string;
  estado: string;
  totalAmount: number;
  codigoReserva: string;
}
