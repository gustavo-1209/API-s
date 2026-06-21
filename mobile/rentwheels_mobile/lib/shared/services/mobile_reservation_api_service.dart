import 'package:uuid/uuid.dart';

import '../mappers/reservation_mapper.dart';
import 'graphql_api_service.dart';

class MobileReservationApiService {
  MobileReservationApiService(this._graphql);

  final GraphQLApiService _graphql;
  final _uuid = const Uuid();

  static const _crearReservaMutation = '''
mutation CrearReserva(\$input: CrearReservaInput!) {
  crearReserva(input: \$input) {
    reservaId
    codigoReserva
    estado
    correlationId
    reserva {
      id
      codigoReserva
      vehiculoId
      clienteId
      totalAmount
      status
    }
  }
}
''';

  String newIdempotencyKey() => _uuid.v4();

  String newCorrelationId() => _uuid.v4();

  Future<CrearReservaApiResult> crearReserva({
    required String vehiculoId,
    required String clienteId,
    required DateTime fechaInicio,
    required DateTime fechaFin,
    required String authorization,
    String? agenciaId,
  }) async {
    final idempotencyKey = newIdempotencyKey();
    final correlationId = newCorrelationId();

    final headers = <String, String>{
      'x-idempotency-key': idempotencyKey,
      'x-correlation-id': correlationId,
      'Authorization': authorization,
    };

    final input = <String, dynamic>{
      'vehiculoId': vehiculoId,
      'clienteId': clienteId,
      'fechaInicio': _formatApiDate(fechaInicio),
      'fechaFin': _formatApiDate(fechaFin),
      if (agenciaId != null && agenciaId.isNotEmpty) 'agenciaId': agenciaId,
    };

    final data = await _graphql.execute(
      query: _crearReservaMutation,
      variables: {'input': input},
      headers: headers,
      authorization: authorization,
    );

    return mapCrearReservaResponse(data);
  }

  String _formatApiDate(DateTime date) {
    final normalized = DateTime(date.year, date.month, date.day, 10);
    return normalized.toUtc().toIso8601String();
  }
}
