import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/vehicle.dart';

class LocalReservedVehicleService {
  static const _storageKey = 'rentwheels_reserved_vehicle_ids';

  Future<List<String>> getReservedVehicleIds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) return [];

      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => e.toString()).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> setReservedVehicleIds(List<String> ids) async {
    try {
      await _save(ids);
    } catch (_) {
      // Ignorar errores de storage.
    }
  }

  Future<void> addReservedVehicleId(String vehicleId) async {
    try {
      final ids = await getReservedVehicleIds();
      if (ids.contains(vehicleId)) return;

      ids.add(vehicleId);
      await _save(ids);
    } catch (_) {
      // No romper flujo de reserva si falla el storage.
    }
  }

  Future<void> removeReservedVehicleId(String vehicleId) async {
    try {
      final ids = await getReservedVehicleIds();
      ids.remove(vehicleId);
      await _save(ids);
    } catch (_) {
      // Ignorar errores de storage en cancelación local.
    }
  }

  Future<void> clearReservedVehicleIds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKey);
    } catch (_) {
      // Ignorar.
    }
  }

  /// GraphQL es fuente de verdad: si el backend vuelve a listar el vehículo
  /// como disponible, deja de ocultarse localmente.
  Future<Set<String>> reconcileWithAvailableVehicles(
    List<Vehicle> availableVehicles,
  ) async {
    try {
      final localIds = await getReservedVehicleIds();
      if (localIds.isEmpty) return {};

      final backendAvailableIds = availableVehicles
          .where(_isBackendAvailable)
          .map((v) => v.id)
          .toSet();

      final corrected =
          localIds.where((id) => !backendAvailableIds.contains(id)).toList();

      await setReservedVehicleIds(corrected);
      return corrected.toSet();
    } catch (_) {
      return (await getReservedVehicleIds()).toSet();
    }
  }

  static bool _isBackendAvailable(Vehicle vehicle) {
    if (vehicle.backendStatus != null) {
      return vehicle.disponible &&
          vehicle.backendStatus!.toUpperCase() == 'DISPONIBLE';
    }
    return vehicle.canAddToCart;
  }

  Future<void> _save(List<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode(ids));
  }
}
