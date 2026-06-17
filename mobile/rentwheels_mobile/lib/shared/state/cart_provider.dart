import 'package:flutter/foundation.dart';

import '../models/cart_item.dart';
import '../models/vehicle.dart';
import '../services/local_cart_service.dart';

class CartProvider extends ChangeNotifier {
  CartProvider(this._service);

  final LocalCartService _service;

  List<CartItem> _items = [];
  bool _isLoading = false;

  List<CartItem> get items => List.unmodifiable(_items);
  bool get isLoading => _isLoading;
  int get itemCount => _items.length;
  double get total => _service.calculateTotal(_items);
  bool get isEmpty => _items.isEmpty;

  Future<void> loadCart() async {
    _isLoading = true;
    notifyListeners();

    _items = await _service.loadCart();

    _isLoading = false;
    notifyListeners();
  }

  Future<void> addVehicle(
    Vehicle vehicle, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    await _service.addVehicle(
      vehicle,
      startDate: startDate,
      endDate: endDate,
    );
    _items = await _service.loadCart();
    notifyListeners();
  }

  Future<void> removeVehicle(String vehicleId) async {
    await _service.removeVehicle(vehicleId);
    _items = await _service.loadCart();
    notifyListeners();
  }

  Future<void> updateDates(
    String vehicleId, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    await _service.updateDates(
      vehicleId,
      startDate: startDate,
      endDate: endDate,
    );
    _items = await _service.loadCart();
    notifyListeners();
  }

  Future<void> clearCart() async {
    await _service.clearCart();
    _items = [];
    notifyListeners();
  }
}
