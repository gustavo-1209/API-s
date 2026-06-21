import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/auth_session.dart';
import '../utils/jwt_utils.dart';

class AuthException implements Exception {
  AuthException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class AuthService {
  AuthService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      Uri.parse('$clienteApiBaseUrl/auth/login'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'email': email.trim(),
        'password': password,
      }),
    );

    if (response.statusCode == 401) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'Credenciales incorrectas. Verifica tu email y contraseña.',
        ),
        statusCode: 401,
      );
    }

    if (response.statusCode == 403) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'Tu usuario no tiene permisos para acceder.',
        ),
        statusCode: 403,
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'No se pudo iniciar sesión. Intenta de nuevo.',
        ),
        statusCode: response.statusCode,
      );
    }

    return _parseAuthSession(response.body);
  }

  Future<AuthSession> register({
    required String email,
    required String password,
    required String nombres,
    required String apellidos,
    required String telefono,
  }) async {
    final response = await _client.post(
      Uri.parse('$clienteApiBaseUrl/auth/register'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'email': email.trim(),
        'password': password,
        'nombres': nombres.trim(),
        'apellidos': apellidos.trim(),
        'telefono': telefono.trim(),
      }),
    );

    if (response.statusCode == 409) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'Ya existe una cuenta con este correo electrónico.',
        ),
        statusCode: 409,
      );
    }

    if (response.statusCode == 400) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'Revisa los datos ingresados e intenta de nuevo.',
        ),
        statusCode: 400,
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        _extractErrorMessage(
          response,
          fallback: 'No se pudo completar el registro. Intenta de nuevo.',
        ),
        statusCode: response.statusCode,
      );
    }

    try {
      return _parseAuthSession(response.body);
    } on AuthException {
      return login(email: email, password: password);
    }
  }

  AuthSession _parseAuthSession(String body) {
    final decoded = jsonDecode(body);
    if (decoded is! Map<String, dynamic>) {
      throw AuthException('Respuesta de autenticación inválida.');
    }

    final raw = _unwrapAuthData(decoded);
    final token = raw['token']?.toString();
    if (token == null || token.isEmpty) {
      throw AuthException('El servidor no devolvió un token válido.');
    }

    final user = raw['user'];
    final userMap = user is Map<String, dynamic> ? user : <String, dynamic>{};

    final clienteId = _resolveClienteId(userMap, token);
    if (clienteId == null || clienteId.isEmpty) {
      throw AuthException(
        'No se pudo obtener el identificador del cliente.',
      );
    }

    final nombres = userMap['nombres']?.toString();
    final apellidos = userMap['apellidos']?.toString();
    final role = userMap['role']?.toString() ??
        raw['role']?.toString() ??
        getRoleFromToken(token) ??
        'CLIENTE';

    final fullName = [
      if (nombres != null && nombres.trim().isNotEmpty) nombres.trim(),
      if (apellidos != null && apellidos.trim().isNotEmpty) apellidos.trim(),
    ].join(' ');

    return AuthSession(
      token: token,
      clienteId: clienteId,
      email: userMap['email']?.toString() ?? decodeJwtPayload(token)?.email,
      role: role,
      nombres: nombres,
      apellidos: apellidos,
      name: fullName.isEmpty ? null : fullName,
    );
  }

  Map<String, dynamic> _unwrapAuthData(Map<String, dynamic> body) {
    if (body.containsKey('success') && body['data'] is Map<String, dynamic>) {
      return body['data'] as Map<String, dynamic>;
    }
    return body;
  }

  String? _resolveClienteId(Map<String, dynamic> user, String token) {
    final fromUser = user['clienteId'] ??
        user['cliente_id'] ??
        user['cli_id'] ??
        user['id'];
    if (fromUser != null && fromUser.toString().isNotEmpty) {
      return fromUser.toString();
    }
    return decodeJwtPayload(token)?.id;
  }

  String _extractErrorMessage(http.Response response, {required String fallback}) {
    try {
      final body = jsonDecode(response.body);
      if (body is Map<String, dynamic>) {
        final error = body['error'];
        if (error is Map && error['message'] != null) {
          return error['message'].toString();
        }
        if (body['message'] != null) {
          return body['message'].toString();
        }
      }
    } catch (_) {
      // usar fallback
    }
    return fallback;
  }

  static const _jsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
