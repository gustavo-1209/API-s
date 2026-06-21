import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../shared/services/local_data_cleanup_service.dart';
import '../../shared/state/auth_provider.dart';
import '../../shared/state/cart_provider.dart';
import '../../shared/state/catalog_provider.dart';
import '../../shared/state/reservation_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmClearLocalData(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Limpiar datos locales'),
        content: const Text(
          'Se eliminarán el carrito, las reservas guardadas en este dispositivo '
          'y los vehículos ocultos localmente. Tu sesión no se cerrará.\n\n'
          '¿Deseas continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Limpiar'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final cleanup = context.read<LocalDataCleanupService>();
    final cart = context.read<CartProvider>();
    final reservations = context.read<ReservationProvider>();
    final catalog = context.read<CatalogProvider>();

    await cleanup.clearAllLocalData();
    await cart.loadCart();
    await reservations.loadReservations();
    await catalog.loadCatalog();

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Datos locales eliminados correctamente.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final auth = context.watch<AuthProvider>();
    final session = auth.session;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Perfil',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: colorScheme.primaryContainer,
                      child: Icon(
                        Icons.person,
                        size: 40,
                        color: colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      auth.isAuthenticated
                          ? session!.displayName
                          : 'Invitado',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.isAuthenticated
                          ? (session!.email ?? '')
                          : 'Inicia sesión para reservar vehículos',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (!auth.isAuthenticated) ...[
              FilledButton.icon(
                onPressed: () => context.push('/login'),
                icon: const Icon(Icons.login),
                label: const Text('Iniciar sesión'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.push('/register'),
                icon: const Icon(Icons.person_add_outlined),
                label: const Text('Crear cuenta'),
              ),
            ] else ...[
              if (session!.email != null)
                _ProfileInfoTile(
                  icon: Icons.email_outlined,
                  label: 'Correo',
                  value: session.email!,
                ),
              const SizedBox(height: 8),
              _ProfileInfoTile(
                icon: Icons.badge_outlined,
                label: 'Nombre',
                value: session.displayName,
              ),
              if (session.role != null) ...[
                const SizedBox(height: 8),
                _ProfileInfoTile(
                  icon: Icons.verified_user_outlined,
                  label: 'Rol',
                  value: session.role!,
                ),
              ],
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () async {
                  final catalog = context.read<CatalogProvider>();
                  await auth.logout();
                  if (!context.mounted) return;
                  await catalog.loadCatalog();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Sesión cerrada correctamente.'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                },
                icon: const Icon(Icons.logout),
                label: const Text('Cerrar sesión'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colorScheme.error,
                  side: BorderSide(color: colorScheme.error),
                ),
              ),
            ],
            const SizedBox(height: 32),
            Text(
              'Datos en este dispositivo',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => _confirmClearLocalData(context),
              icon: const Icon(Icons.cleaning_services_outlined, size: 18),
              label: const Text('Limpiar datos locales'),
              style: OutlinedButton.styleFrom(
                foregroundColor: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Útil para pruebas: borra carrito, reservas locales y vehículos ocultos.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileInfoTile extends StatelessWidget {
  const _ProfileInfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: ListTile(
        leading: Icon(icon, color: theme.colorScheme.primary),
        title: Text(label, style: theme.textTheme.bodySmall),
        subtitle: Text(
          value,
          style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
