import 'dart:convert';
import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart_item.dart';
import '../models/reservation.dart';

class LocalReservationService {
  static const _storageKey = 'rentwheels_reservations';

  Future<List<Reservation>> loadReservations() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return [];

    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => Reservation.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  Future<void> _saveReservations(List<Reservation> reservations) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded =
        jsonEncode(reservations.map((e) => e.toJson()).toList());
    await prefs.setString(_storageKey, encoded);
  }

  String _generateCode() {
    final now = DateTime.now();
    final datePart =
        '${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}';
    final random = Random().nextInt(9000) + 1000;
    return 'RW-$datePart-$random';
  }

  Future<List<Reservation>> createFromCart(List<CartItem> cartItems) async {
    final existing = await loadReservations();
    final now = DateTime.now();

    final newReservations = cartItems.map((item) {
      return Reservation(
        id: '${now.millisecondsSinceEpoch}_${item.vehicle.id}',
        code: _generateCode(),
        vehicle: item.vehicle,
        startDate: item.startDate,
        endDate: item.endDate,
        total: item.subtotal,
        status: ReservationStatus.pendiente,
        createdAt: now,
      );
    }).toList();

    existing.insertAll(0, newReservations);
    await _saveReservations(existing);
    return newReservations;
  }

  Future<Reservation?> cancelReservation(String reservationId) async {
    final reservations = await loadReservations();
    final index = reservations.indexWhere((r) => r.id == reservationId);
    if (index == -1) return null;

    final reservation = reservations[index];
    if (!reservation.status.canCancel) return null;

    final updated = reservation.copyWith(status: ReservationStatus.cancelada);
    reservations[index] = updated;
    await _saveReservations(reservations);
    return updated;
  }

  Future<Reservation?> updateStatus(
    String reservationId,
    ReservationStatus status,
  ) async {
    final reservations = await loadReservations();
    final index = reservations.indexWhere((r) => r.id == reservationId);
    if (index == -1) return null;

    final updated = reservations[index].copyWith(status: status);
    reservations[index] = updated;
    await _saveReservations(reservations);
    return updated;
  }
}
