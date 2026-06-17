import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/cart_item.dart';
import '../models/vehicle.dart';

class LocalCartService {
  static const _storageKey = 'rentwheels_cart';

  Future<List<CartItem>> loadCart() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw == null || raw.isEmpty) return [];

    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _saveCart(List<CartItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(items.map((e) => e.toJson()).toList());
    await prefs.setString(_storageKey, encoded);
  }

  Future<void> addVehicle(
    Vehicle vehicle, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final items = await loadCart();
    items.removeWhere((item) => item.vehicle.id == vehicle.id);
    items.add(CartItem(
      vehicle: vehicle,
      startDate: startDate,
      endDate: endDate,
    ));
    await _saveCart(items);
  }

  Future<void> removeVehicle(String vehicleId) async {
    final items = await loadCart();
    items.removeWhere((item) => item.vehicle.id == vehicleId);
    await _saveCart(items);
  }

  Future<void> updateDates(
    String vehicleId, {
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final items = await loadCart();
    final index = items.indexWhere((item) => item.vehicle.id == vehicleId);
    if (index == -1) return;

    items[index] = items[index].copyWith(
      startDate: startDate,
      endDate: endDate,
    );
    await _saveCart(items);
  }

  Future<void> clearCart() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }

  double calculateTotal(List<CartItem> items) {
    return items.fold(0.0, (sum, item) => sum + item.subtotal);
  }
}
