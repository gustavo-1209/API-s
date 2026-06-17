enum VehicleStatus {
  disponible,
  enProcesoReserva,
  enUso,
  mantenimiento,
}

extension VehicleStatusExtension on VehicleStatus {
  String get label {
    switch (this) {
      case VehicleStatus.disponible:
        return 'Disponible';
      case VehicleStatus.enProcesoReserva:
        return 'En proceso de reserva';
      case VehicleStatus.enUso:
        return 'En uso';
      case VehicleStatus.mantenimiento:
        return 'Mantenimiento';
    }
  }

  bool get isAvailable => this == VehicleStatus.disponible;

  static VehicleStatus fromString(String value) {
    return VehicleStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => VehicleStatus.disponible,
    );
  }
}

class Vehicle {
  const Vehicle({
    required this.id,
    required this.brand,
    required this.model,
    required this.year,
    required this.category,
    required this.transmission,
    required this.fuel,
    required this.pricePerDay,
    required this.description,
    required this.status,
    this.imageUrl,
  });

  final String id;
  final String brand;
  final String model;
  final int year;
  final String category;
  final String transmission;
  final String fuel;
  final double pricePerDay;
  final String description;
  final VehicleStatus status;
  final String? imageUrl;

  String get displayName => '$brand $model';

  Map<String, dynamic> toJson() => {
        'id': id,
        'brand': brand,
        'model': model,
        'year': year,
        'category': category,
        'transmission': transmission,
        'fuel': fuel,
        'pricePerDay': pricePerDay,
        'description': description,
        'status': status.name,
        'imageUrl': imageUrl,
      };

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: json['id'] as String,
        brand: json['brand'] as String,
        model: json['model'] as String,
        year: json['year'] as int,
        category: json['category'] as String,
        transmission: json['transmission'] as String,
        fuel: json['fuel'] as String,
        pricePerDay: (json['pricePerDay'] as num).toDouble(),
        description: json['description'] as String,
        status: VehicleStatusExtension.fromString(json['status'] as String),
        imageUrl: json['imageUrl'] as String?,
      );
}
