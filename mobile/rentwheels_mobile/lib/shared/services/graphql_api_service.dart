import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class GraphQLApiException implements Exception {
  GraphQLApiException(this.message, {this.errors, this.statusCode});

  final String message;
  final List<String>? errors;
  final int? statusCode;

  @override
  String toString() => message;
}

class GraphQLApiService {
  GraphQLApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<Map<String, dynamic>> execute({
    required String query,
    Map<String, dynamic>? variables,
    Map<String, String>? headers,
    String? authorization,
  }) async {
    final requestHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?headers,
    };

    if (authorization != null &&
        authorization.isNotEmpty &&
        !requestHeaders.containsKey('Authorization')) {
      requestHeaders['Authorization'] = authorization;
    }

    http.Response response;
    try {
      response = await _client.post(
        Uri.parse(graphqlUrl),
        headers: requestHeaders,
        body: jsonEncode({
          'query': query,
          'variables': ?variables,
        }),
      );
    } catch (e) {
      throw GraphQLApiException(
        'No se pudo conectar con el servidor. Verifica tu conexión.',
      );
    }

    Map<String, dynamic>? body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw GraphQLApiException(
          'Error HTTP ${response.statusCode} al consultar GraphQL.',
          statusCode: response.statusCode,
        );
      }
      throw GraphQLApiException('Respuesta inválida del servidor GraphQL.');
    }

    final errors = body['errors'];
    if (errors is List && errors.isNotEmpty) {
      final messages = errors
          .map((e) => _extractGraphQLErrorMessage(e))
          .where((m) => m.isNotEmpty)
          .toList();
      throw GraphQLApiException(
        messages.isNotEmpty ? messages.first : 'Error al procesar la solicitud.',
        errors: messages.isNotEmpty ? messages : null,
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw GraphQLApiException(
        _extractHttpErrorMessage(body, response.statusCode),
        statusCode: response.statusCode,
      );
    }

    final data = body['data'];
    if (data is! Map<String, dynamic>) {
      throw GraphQLApiException('El servidor no devolvió datos válidos.');
    }

    return data;
  }

  String _extractGraphQLErrorMessage(dynamic error) {
    if (error is Map<String, dynamic>) {
      final message = error['message']?.toString();
      if (message != null && message.isNotEmpty) return message;

      final extensions = error['extensions'];
      if (extensions is Map && extensions['message'] != null) {
        return extensions['message'].toString();
      }
    }
    return 'Error GraphQL';
  }

  String _extractHttpErrorMessage(Map<String, dynamic> body, int statusCode) {
    final error = body['error'];
    if (error is Map && error['message'] != null) {
      return error['message'].toString();
    }
    if (body['message'] != null) {
      return body['message'].toString();
    }
    return 'Error HTTP $statusCode al consultar GraphQL.';
  }
}
