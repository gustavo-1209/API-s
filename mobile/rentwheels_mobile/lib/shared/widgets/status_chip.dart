import 'package:flutter/material.dart';

import '../models/reservation.dart';
import '../models/vehicle.dart';

class StatusChip extends StatelessWidget {
  const StatusChip.vehicle({
    super.key,
    required VehicleStatus status,
  }) : _vehicleStatus = status,
       _reservationStatus = null;

  const StatusChip.reservation({
    super.key,
    required ReservationStatus status,
  }) : _reservationStatus = status,
       _vehicleStatus = null;

  final VehicleStatus? _vehicleStatus;
  final ReservationStatus? _reservationStatus;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final (label, color, bgColor) = _resolveColors(colorScheme);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }

  (String, Color, Color) _resolveColors(ColorScheme colorScheme) {
    if (_vehicleStatus != null) {
      switch (_vehicleStatus) {
        case VehicleStatus.disponible:
          return (
            'Disponible',
            colorScheme.primary,
            colorScheme.primaryContainer,
          );
        case VehicleStatus.enProcesoReserva:
          return (
            'En proceso de reserva',
            colorScheme.tertiary,
            colorScheme.tertiaryContainer,
          );
        case VehicleStatus.enUso:
          return (
            'En uso',
            colorScheme.secondary,
            colorScheme.secondaryContainer,
          );
        case VehicleStatus.mantenimiento:
          return (
            'Mantenimiento',
            colorScheme.error,
            colorScheme.errorContainer,
          );
      }
    }

    final status = _reservationStatus ?? ReservationStatus.pendiente;

    switch (status) {
      case ReservationStatus.pendiente:
        return (
          'Pendiente',
          colorScheme.tertiary,
          colorScheme.tertiaryContainer,
        );
      case ReservationStatus.confirmada:
        return (
          'Confirmada',
          colorScheme.primary,
          colorScheme.primaryContainer,
        );
      case ReservationStatus.activa:
        return (
          'Activa',
          colorScheme.secondary,
          colorScheme.secondaryContainer,
        );
      case ReservationStatus.completada:
        return ('Completada', colorScheme.outline, colorScheme.surfaceContainerHighest);
      case ReservationStatus.cancelada:
        return (
          'Cancelada',
          colorScheme.error,
          colorScheme.errorContainer,
        );
    }
  }
}
