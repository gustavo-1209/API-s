import '../services/local_cart_service.dart';
import '../services/local_reservation_service.dart';
import '../services/local_reserved_vehicle_service.dart';

/// Limpieza de datos locales para pruebas/demo.
class LocalDataCleanupService {
  LocalDataCleanupService(
    this._cartService,
    this._reservationService,
    this._reservedVehicleService,
  );

  final LocalCartService _cartService;
  final LocalReservationService _reservationService;
  final LocalReservedVehicleService _reservedVehicleService;

  Future<void> clearAllLocalData() async {
    await _cartService.clearCart();
    await _reservationService.clearAllReservations();
    await _reservedVehicleService.clearReservedVehicleIds();
  }
}
