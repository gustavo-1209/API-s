import 'vehicle.dart';

enum ReservationStatus {
  pendiente,
  confirmada,
  activa,
  completada,
  cancelada,
}

extension ReservationStatusExtension on ReservationStatus {
  String get label {
    switch (this) {
      case ReservationStatus.pendiente:
        return 'Pendiente';
      case ReservationStatus.confirmada:
        return 'Confirmada';
      case ReservationStatus.activa:
        return 'Activa';
      case ReservationStatus.completada:
        return 'Completada';
      case ReservationStatus.cancelada:
        return 'Cancelada';
    }
  }

  bool get canCancel => this == ReservationStatus.pendiente;

  static ReservationStatus fromString(String value) {
    return ReservationStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => ReservationStatus.pendiente,
    );
  }
}

class Reservation {
  const Reservation({
    required this.id,
    required this.code,
    required this.vehicle,
    required this.startDate,
    required this.endDate,
    required this.total,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String code;
  final Vehicle vehicle;
  final DateTime startDate;
  final DateTime endDate;
  final double total;
  final ReservationStatus status;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'code': code,
        'vehicle': vehicle.toJson(),
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
        'total': total,
        'status': status.name,
        'createdAt': createdAt.toIso8601String(),
      };

  factory Reservation.fromJson(Map<String, dynamic> json) => Reservation(
        id: json['id'] as String,
        code: json['code'] as String,
        vehicle: Vehicle.fromJson(json['vehicle'] as Map<String, dynamic>),
        startDate: DateTime.parse(json['startDate'] as String),
        endDate: DateTime.parse(json['endDate'] as String),
        total: (json['total'] as num).toDouble(),
        status: ReservationStatusExtension.fromString(json['status'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Reservation copyWith({ReservationStatus? status}) {
    return Reservation(
      id: id,
      code: code,
      vehicle: vehicle,
      startDate: startDate,
      endDate: endDate,
      total: total,
      status: status ?? this.status,
      createdAt: createdAt,
    );
  }
}
