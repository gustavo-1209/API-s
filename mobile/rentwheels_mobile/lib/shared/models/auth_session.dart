class AuthSession {
  const AuthSession({
    required this.token,
    required this.clienteId,
    this.name,
    this.email,
    this.role,
    this.nombres,
    this.apellidos,
  });

  final String token;
  final String clienteId;
  final String? name;
  final String? email;
  final String? role;
  final String? nombres;
  final String? apellidos;

  String get displayName {
    if (name != null && name!.trim().isNotEmpty) return name!.trim();
    final parts = [nombres, apellidos]
        .where((p) => p != null && p.trim().isNotEmpty)
        .map((p) => p!.trim())
        .join(' ');
    return parts.isNotEmpty ? parts : (email ?? 'Cliente');
  }

  Map<String, dynamic> toJson() => {
        'token': token,
        'clienteId': clienteId,
        'name': name,
        'email': email,
        'role': role,
        'nombres': nombres,
        'apellidos': apellidos,
      };

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        token: json['token'] as String,
        clienteId: json['clienteId'] as String,
        name: json['name'] as String?,
        email: json['email'] as String?,
        role: json['role'] as String?,
        nombres: json['nombres'] as String?,
        apellidos: json['apellidos'] as String?,
      );
}
