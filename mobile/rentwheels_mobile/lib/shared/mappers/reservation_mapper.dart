import '../models/reservation.dart';
import '../models/vehicle.dart';

ReservationStatus mapBackendReservationStatus(String? status) {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDIENTE':
      return ReservationStatus.pendiente;
    case 'CONFIRMADA':
      return ReservationStatus.confirmada;
    case 'ACTIVA':
      return ReservationStatus.activa;
    case 'COMPLETADA':
      return ReservationStatus.completada;
    case 'CANCELADA':
      return ReservationStatus.cancelada;
    default:
      return ReservationStatus.pendiente;
  }
}

class CrearReservaApiResult {
  const CrearReservaApiResult({
    required this.reservaId,
    required this.codigoReserva,
    required this.estado,
    required this.correlationId,
    required this.totalAmount,
    required this.vehiculoId,
  });

  final String reservaId;
  final String codigoReserva;
  final String estado;
  final String? correlationId;
  final double totalAmount;
  final String vehiculoId;
}

CrearReservaApiResult mapCrearReservaResponse(Map<String, dynamic> data) {
  final payload = data['crearReserva'] as Map<String, dynamic>;
  final reserva = payload['reserva'] as Map<String, dynamic>?;

  return CrearReservaApiResult(
    reservaId: payload['reservaId'] as String,
    codigoReserva: payload['codigoReserva'] as String? ?? '',
    estado: payload['estado'] as String? ?? '',
    correlationId: payload['correlationId'] as String?,
    totalAmount: (reserva?['totalAmount'] as num?)?.toDouble() ?? 0,
    vehiculoId: reserva?['vehiculoId'] as String? ?? '',
  );
}

Reservation mapApiResultToLocalReservation({
  required CrearReservaApiResult apiResult,
  required Vehicle vehicle,
  required DateTime startDate,
  required DateTime endDate,
  double? fallbackTotal,
}) {
  return Reservation(
    id: apiResult.reservaId,
    code: apiResult.codigoReserva.isNotEmpty
        ? apiResult.codigoReserva
        : apiResult.reservaId,
    vehicle: vehicle,
    startDate: startDate,
    endDate: endDate,
    total: apiResult.totalAmount > 0
        ? apiResult.totalAmount
        : (fallbackTotal ?? 0),
    status: mapBackendReservationStatus(apiResult.estado),
    createdAt: DateTime.now(),
  );
}
