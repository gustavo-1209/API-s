import 'package:flutter/foundation.dart';

import '../models/cart_item.dart';
import '../models/reservation.dart';
import '../services/local_reservation_service.dart';

class ReservationProvider extends ChangeNotifier {
  ReservationProvider(this._service);

  final LocalReservationService _service;

  List<Reservation> _reservations = [];
  bool _isLoading = false;

  List<Reservation> get reservations => List.unmodifiable(_reservations);
  bool get isLoading => _isLoading;

  Future<void> loadReservations() async {
    _isLoading = true;
    notifyListeners();

    _reservations = await _service.loadReservations();

    _isLoading = false;
    notifyListeners();
  }

  Future<List<Reservation>> createFromCart(List<CartItem> cartItems) async {
    final created = await _service.createFromCart(cartItems);
    _reservations = await _service.loadReservations();
    notifyListeners();
    return created;
  }

  Future<bool> cancelReservation(String reservationId) async {
    final result = await _service.cancelReservation(reservationId);
    if (result == null) return false;

    _reservations = await _service.loadReservations();
    notifyListeners();
    return true;
  }

  Future<void> updateStatus(
    String reservationId,
    ReservationStatus status,
  ) async {
    await _service.updateStatus(reservationId, status);
    _reservations = await _service.loadReservations();
    notifyListeners();
  }
}
