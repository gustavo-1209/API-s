import '../models/vehicle.dart';

Vehicle mapApiVehicleToModel(Map<String, dynamic> json) {
  final statusRaw = (json['status'] as String? ?? '').toUpperCase();
  final disponible = json['disponible'] as bool? ?? false;
  final nombre = json['nombre'] as String? ?? 'Vehículo';

  return Vehicle(
    id: json['id'] as String,
    brand: '',
    model: nombre,
    year: 0,
    category: json['categoria'] as String? ?? 'Sin categoría',
    transmission: 'No especificado',
    fuel: 'No especificado',
    pricePerDay: (json['precioPorDia'] as num).toDouble(),
    description: json['descripcion'] as String? ?? '',
    status: _mapVehicleStatus(statusRaw, disponible),
    imageUrl: json['imagenUrl'] as String?,
    disponible: disponible,
    backendStatus: statusRaw,
    agenciaId: json['agenciaId'] as String?,
    moneda: json['moneda'] as String? ?? 'USD',
  );
}

VehicleStatus _mapVehicleStatus(String status, bool disponible) {
  switch (status) {
    case 'DISPONIBLE':
      return disponible ? VehicleStatus.disponible : VehicleStatus.enProcesoReserva;
    case 'RESERVADO':
      return VehicleStatus.enProcesoReserva;
    case 'EN_USO':
      return VehicleStatus.enUso;
    case 'MANTENIMIENTO':
    case 'INACTIVO':
      return VehicleStatus.mantenimiento;
    default:
      return disponible ? VehicleStatus.disponible : VehicleStatus.mantenimiento;
  }
}

DisponibilidadResult mapApiDisponibilidad(Map<String, dynamic> json) {
  return DisponibilidadResult(
    vehiculoId: json['vehiculoId'] as String,
    disponible: json['disponible'] as bool? ?? false,
    status: (json['status'] as String? ?? '').toUpperCase(),
    mensaje: json['mensaje'] as String? ?? '',
  );
}

class DisponibilidadResult {
  const DisponibilidadResult({
    required this.vehiculoId,
    required this.disponible,
    required this.status,
    required this.mensaje,
  });

  final String vehiculoId;
  final bool disponible;
  final String status;
  final String mensaje;

  bool get isAvailableForRent =>
      disponible && status.toUpperCase() == 'DISPONIBLE';
}
