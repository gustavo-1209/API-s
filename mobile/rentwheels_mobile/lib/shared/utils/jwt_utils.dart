import 'dart:convert';

class JwtPayload {
  const JwtPayload({
    required this.id,
    required this.email,
    this.role,
  });

  final String id;
  final String email;
  final String? role;
}

JwtPayload? decodeJwtPayload(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return null;

    var segment = parts[1];
    final padding = (4 - segment.length % 4) % 4;
    segment += '=' * padding;

    final normalized = segment.replaceAll('-', '+').replaceAll('_', '/');
    final decoded = utf8.decode(base64.decode(normalized));
    final json = jsonDecode(decoded) as Map<String, dynamic>;

    final id = json['id']?.toString();
    final email = json['email']?.toString();
    if (id == null || id.isEmpty) return null;

    return JwtPayload(
      id: id,
      email: email ?? '',
      role: json['role']?.toString(),
    );
  } catch (_) {
    return null;
  }
}

String? getRoleFromToken(String? token) {
  if (token == null || token.isEmpty) return null;
  return decodeJwtPayload(token)?.role;
}
