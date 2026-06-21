import 'package:flutter/foundation.dart';

import '../mappers/reservation_mapper.dart';
import '../models/cart_item.dart';
import '../models/reservation.dart';
import '../services/graphql_api_service.dart';
import '../services/local_reservation_service.dart';
import '../services/mobile_reservation_api_service.dart';
import '../services/mobile_vehicle_api_service.dart';
import '../state/auth_provider.dart';
import '../state/catalog_provider.dart';

class ReservationException implements Exception {
  ReservationException(this.message);
  final String message;

  @override
  String toString() => message;
}

class ReservationProvider extends ChangeNotifier {
  ReservationProvider(
    this._localService,
    this._vehicleApi,
    this._reservationApi,
    this._auth,
    this._catalogProvider,
  );

  final LocalReservationService _localService;
  final MobileVehicleApiService _vehicleApi;
  final MobileReservationApiService _reservationApi;
  final AuthProvider _auth;
  final CatalogProvider _catalogProvider;

  List<Reservation> _reservations = [];
  bool _isLoading = false;

  List<Reservation> get reservations => List.unmodifiable(_reservations);
  bool get isLoading => _isLoading;

  Future<void> loadReservations() async {
    _isLoading = true;
    notifyListeners();

    _reservations = await _localService.loadReservations();

    _isLoading = false;
    notifyListeners();
  }

  /// Crea reservas reales vía GraphQL y las persiste localmente.
  ///
  /// Pendiente conectar `misReservas(clienteId)` y cancelación real cuando
  /// el backend lo exponga.
  Future<List<Reservation>> createFromCart(List<CartItem> cartItems) async {
    if (!_auth.isAuthenticated) {
      throw ReservationException('Inicia sesión para crear una reserva.');
    }

    final clienteId = _auth.clienteId;
    final authorization = _auth.authorizationHeader;

    if (clienteId == null ||
        clienteId.isEmpty ||
        authorization.isEmpty) {
      throw ReservationException(
        'Sesión inválida. Vuelve a iniciar sesión.',
      );
    }

    final created = <Reservation>[];
    final reservedVehicleIds = <String>[];

    for (final item in cartItems) {
      final availability =
          await _vehicleApi.checkAvailability(item.vehicle.id);

      if (!availability.isAvailableForRent) {
        throw ReservationException(
          availability.mensaje.isNotEmpty
              ? availability.mensaje
              : '${item.vehicle.displayName} no está disponible para reservar.',
        );
      }

      try {
        final apiResult = await _reservationApi.crearReserva(
          vehiculoId: item.vehicle.id,
          clienteId: clienteId,
          fechaInicio: item.startDate,
          fechaFin: item.endDate,
          agenciaId: item.vehicle.agenciaId,
          authorization: authorization,
        );

        final reservation = mapApiResultToLocalReservation(
          apiResult: apiResult,
          vehicle: item.vehicle,
          startDate: item.startDate,
          endDate: item.endDate,
          fallbackTotal: item.subtotal,
        );

        await _localService.saveReservation(reservation);
        created.add(reservation);
        reservedVehicleIds.add(item.vehicle.id);
      } on GraphQLApiException catch (e) {
        throw ReservationException(e.message);
      }
    }

    if (reservedVehicleIds.isNotEmpty) {
      await _catalogProvider.refreshAfterReservation(reservedVehicleIds);
    }

    _reservations = await _localService.loadReservations();
    notifyListeners();
    return created;
  }

  Future<bool> cancelReservation(String reservationId) async {
    final reservations = await _localService.loadReservations();
    Reservation? target;
    for (final r in reservations) {
      if (r.id == reservationId) {
        target = r;
        break;
      }
    }

    if (target == null || !target.status.canCancel) {
      return false;
    }

    final vehicleId = target.vehicle.id;
    final wasPending = target.status == ReservationStatus.pendiente;

    final result = await _localService.cancelReservation(reservationId);
    if (result == null) return false;

    if (wasPending) {
      await _catalogProvider.refreshAfterLocalCancellation(vehicleId);
    }

    _reservations = await _localService.loadReservations();
    notifyListeners();
    return true;
  }

  Future<void> updateStatus(
    String reservationId,
    ReservationStatus status,
  ) async {
    await _localService.updateStatus(reservationId, status);
    _reservations = await _localService.loadReservations();
    notifyListeners();
  }
}
