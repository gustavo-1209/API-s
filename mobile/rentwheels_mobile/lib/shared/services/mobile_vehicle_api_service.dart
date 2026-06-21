import '../mappers/vehicle_mapper.dart';
import '../models/vehicle.dart';
import '../state/auth_provider.dart';
import 'graphql_api_service.dart';

class MobileVehicleApiService {
  MobileVehicleApiService(this._graphql, this._auth);

  final GraphQLApiService _graphql;
  final AuthProvider _auth;

  static const _vehiculosDisponiblesQuery = '''
query {
  vehiculosDisponibles {
    id
    nombre
    descripcion
    precioPorDia
    moneda
    categoria
    agenciaId
    disponible
    status
    imagenUrl
  }
}
''';

  static const _vehiculoQuery = '''
query Vehiculo(\$id: ID!) {
  vehiculo(id: \$id) {
    id
    nombre
    descripcion
    precioPorDia
    moneda
    categoria
    agenciaId
    disponible
    status
    imagenUrl
  }
}
''';

  static const _disponibilidadQuery = '''
query DisponibilidadVehiculo(\$id: ID!) {
  disponibilidadVehiculo(id: \$id) {
    vehiculoId
    disponible
    status
    mensaje
  }
}
''';

  String? get _authorization {
    final header = _auth.authorizationHeader;
    return header.isEmpty ? null : header;
  }

  Future<List<Vehicle>> getVehicles() async {
    final data = await _graphql.execute(
      query: _vehiculosDisponiblesQuery,
      authorization: _authorization,
    );
    final list = data['vehiculosDisponibles'] as List<dynamic>? ?? [];
    return list
        .map((e) => mapApiVehicleToModel(e as Map<String, dynamic>))
        .toList();
  }

  Future<Vehicle?> getVehicleById(String id) async {
    final data = await _graphql.execute(
      query: _vehiculoQuery,
      variables: {'id': id},
      authorization: _authorization,
    );
    final raw = data['vehiculo'];
    if (raw == null) return null;
    return mapApiVehicleToModel(raw as Map<String, dynamic>);
  }

  Future<DisponibilidadResult> checkAvailability(String vehicleId) async {
    final data = await _graphql.execute(
      query: _disponibilidadQuery,
      variables: {'id': vehicleId},
      authorization: _authorization,
    );
    return mapApiDisponibilidad(
      data['disponibilidadVehiculo'] as Map<String, dynamic>,
    );
  }
}
