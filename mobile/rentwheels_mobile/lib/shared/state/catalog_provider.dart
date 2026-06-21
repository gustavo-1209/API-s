import 'package:flutter/foundation.dart';

import '../models/vehicle.dart';
import '../services/local_reserved_vehicle_service.dart';
import '../services/mobile_vehicle_api_service.dart';
import '../services/mock_vehicle_service.dart';

class CatalogProvider extends ChangeNotifier {
  CatalogProvider(
    this._vehicleApi,
    this._reservedVehicleService,
  );

  final MobileVehicleApiService _vehicleApi;
  final LocalReservedVehicleService _reservedVehicleService;

  List<Vehicle> _vehicles = [];
  Set<String> _reservedVehicleIds = {};
  bool _isLoading = false;
  String? _errorMessage;
  bool _usingDebugFallback = false;

  List<Vehicle> get vehicles => List.unmodifiable(_vehicles);
  Set<String> get reservedVehicleIds => Set.unmodifiable(_reservedVehicleIds);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get usingDebugFallback => _usingDebugFallback;

  bool isVehicleReserved(String vehicleId) =>
      _reservedVehicleIds.contains(vehicleId);

  /// Ocultamiento optimista: excluye ids reservados localmente que el backend
  /// aún no refleja en `vehiculosDisponibles`.
  static List<Vehicle> filterForCatalog(
    List<Vehicle> source,
    Set<String> reservedIds,
  ) {
    return source.where((vehicle) {
      if (reservedIds.contains(vehicle.id)) return false;
      return _isCatalogAvailable(vehicle);
    }).toList();
  }

  static bool _isCatalogAvailable(Vehicle vehicle) {
    if (vehicle.backendStatus != null) {
      return vehicle.disponible &&
          vehicle.backendStatus!.toUpperCase() == 'DISPONIBLE';
    }
    return vehicle.canAddToCart;
  }

  Future<void> loadCatalog() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final apiVehicles = await _fetchApiVehicles();
      await _applyCatalogFromApi(apiVehicles);
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _errorMessage = 'No se pudo cargar el catálogo.';
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<List<Vehicle>> _fetchApiVehicles() async {
    _usingDebugFallback = false;
    try {
      return await _vehicleApi.getVehicles();
    } catch (e) {
      if (kDebugMode) {
        _usingDebugFallback = true;
        return MockVehicleService().getVehicles();
      }
      rethrow;
    }
  }

  /// GraphQL primero; luego reconcilia ocultos locales con la respuesta real.
  Future<void> _applyCatalogFromApi(List<Vehicle> apiVehicles) async {
    _reservedVehicleIds =
        await _reservedVehicleService.reconcileWithAvailableVehicles(apiVehicles);
    _vehicles = filterForCatalog(apiVehicles, _reservedVehicleIds);
  }

  /// Ocultamiento optimista tras reserva + refresh y reconciliación con GraphQL.
  Future<void> refreshAfterReservation(Iterable<String> vehicleIds) async {
    for (final id in vehicleIds) {
      await _reservedVehicleService.addReservedVehicleId(id);
    }
    _reservedVehicleIds.addAll(vehicleIds);

    _vehicles =
        _vehicles.where((v) => !_reservedVehicleIds.contains(v.id)).toList();
    notifyListeners();

    try {
      final apiVehicles = await _vehicleApi.getVehicles();
      await _applyCatalogFromApi(apiVehicles);
      _usingDebugFallback = false;
    } catch (_) {
      // Mantener ocultamiento local si falla el refresh remoto.
    }
    notifyListeners();
  }

  /// Cancelación local pendiente: quitar ocultamiento y reconciliar con GraphQL.
  ///
  /// Cuando exista cancelación real en backend, reemplazar por API + WebSocket.
  Future<void> refreshAfterLocalCancellation(String vehicleId) async {
    await _reservedVehicleService.removeReservedVehicleId(vehicleId);
    _reservedVehicleIds.remove(vehicleId);
    await loadCatalog();
  }
}
