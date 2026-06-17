import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/reservation.dart';
import '../state/reservation_provider.dart';
import 'status_chip.dart';
import 'vehicle_card.dart';

class ReservationCard extends StatelessWidget {
  const ReservationCard({super.key, required this.reservation});

  final Reservation reservation;

  static final _currency = NumberFormat.currency(symbol: '\$', decimalDigits: 0);
  static final _dateFormat = DateFormat('dd MMM yyyy', 'es');

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    reservation.code,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                StatusChip.reservation(status: reservation.status),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 72,
                    height: 56,
                    child: VehicleImagePlaceholder(
                      imageUrl: reservation.vehicle.imageUrl,
                      height: 56,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reservation.vehicle.displayName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        reservation.vehicle.category,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.calendar_today_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${_dateFormat.format(reservation.startDate)} — ${_dateFormat.format(reservation.endDate)}',
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Total: ${_currency.format(reservation.total)}',
              style: theme.textTheme.titleSmall?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (reservation.status.canCancel) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _confirmCancel(context),
                  icon: const Icon(Icons.cancel_outlined, size: 18),
                  label: const Text('Cancelar reserva'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.colorScheme.error,
                    side: BorderSide(color: theme.colorScheme.error),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _confirmCancel(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar reserva'),
        content: Text(
          '¿Deseas cancelar la reserva ${reservation.code}? Esta acción no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sí, cancelar'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    final success = await context
        .read<ReservationProvider>()
        .cancelReservation(reservation.id);

    if (context.mounted && success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reserva cancelada correctamente.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}
