import 'vehicle.dart';

class CartItem {
  CartItem({
    required this.vehicle,
    required this.startDate,
    required this.endDate,
  });

  final Vehicle vehicle;
  final DateTime startDate;
  final DateTime endDate;

  int get days {
    final diff = endDate.difference(startDate).inDays;
    return diff < 0 ? 0 : diff + 1;
  }

  double get subtotal => vehicle.pricePerDay * days;

  Map<String, dynamic> toJson() => {
        'vehicle': vehicle.toJson(),
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
      };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        vehicle: Vehicle.fromJson(json['vehicle'] as Map<String, dynamic>),
        startDate: DateTime.parse(json['startDate'] as String),
        endDate: DateTime.parse(json['endDate'] as String),
      );

  CartItem copyWith({
    Vehicle? vehicle,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return CartItem(
      vehicle: vehicle ?? this.vehicle,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}
