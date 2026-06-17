import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../state/cart_provider.dart';
import 'status_chip.dart';

class VehicleCard extends StatelessWidget {
  const VehicleCard({
    super.key,
    required this.vehicle,
    this.onAddToCart,
  });

  final Vehicle vehicle;
  final VoidCallback? onAddToCart;

  static final _currency = NumberFormat.currency(symbol: '\$', decimalDigits: 0);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isAvailable = vehicle.status.isAvailable;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _VehicleImage(vehicle: vehicle, height: 140),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            vehicle.displayName,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${vehicle.year} · ${vehicle.category}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    StatusChip.vehicle(status: vehicle.status),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '${_currency.format(vehicle.pricePerDay)}/día',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.push('/vehicle/${vehicle.id}'),
                        child: const Text('Ver detalle'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilledButton(
                        onPressed: isAvailable ? onAddToCart : null,
                        child: Text(
                          isAvailable ? 'Agregar' : vehicle.status.label,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class VehicleImagePlaceholder extends StatelessWidget {
  const VehicleImagePlaceholder({
    super.key,
    this.imageUrl,
    this.height = 200,
  });

  final String? imageUrl;
  final double height;

  @override
  Widget build(BuildContext context) {
    return _VehicleImage(imageUrl: imageUrl, height: height);
  }
}

class _VehicleImage extends StatelessWidget {
  const _VehicleImage({
    this.vehicle,
    this.imageUrl,
    required this.height,
  });

  final Vehicle? vehicle;
  final String? imageUrl;
  final double height;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final url = imageUrl ?? vehicle?.imageUrl;

    return SizedBox(
      height: height,
      child: url != null
          ? Image.network(
              url,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => _placeholder(theme),
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return _placeholder(theme);
              },
            )
          : _placeholder(theme),
    );
  }

  Widget _placeholder(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            theme.colorScheme.primaryContainer,
            theme.colorScheme.secondaryContainer,
          ],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.directions_car_filled,
          size: height * 0.35,
          color: theme.colorScheme.primary.withValues(alpha: 0.6),
        ),
      ),
    );
  }
}

Future<void> addVehicleToCartWithDefaults(
  BuildContext context,
  Vehicle vehicle,
) async {
  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day + 1);
  final end = DateTime(now.year, now.month, now.day + 3);

  await context.read<CartProvider>().addVehicle(
        vehicle,
        startDate: start,
        endDate: end,
      );

  if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${vehicle.displayName} agregado al carrito'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
