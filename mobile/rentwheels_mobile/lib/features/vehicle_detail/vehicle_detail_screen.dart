import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../shared/models/vehicle.dart';
import '../../shared/services/local_reserved_vehicle_service.dart';
import '../../shared/services/mobile_vehicle_api_service.dart';
import '../../shared/state/cart_provider.dart';
import '../../shared/state/catalog_provider.dart';
import '../../shared/widgets/status_chip.dart';
import '../../shared/widgets/vehicle_card.dart';

class VehicleDetailScreen extends StatefulWidget {
  const VehicleDetailScreen({super.key, required this.vehicleId});

  final String vehicleId;

  @override
  State<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailData {
  const _VehicleDetailData({
    required this.vehicle,
    required this.canAddToCart,
    this.unavailableMessage,
    this.isLocallyReserved = false,
  });

  final Vehicle vehicle;
  final bool canAddToCart;
  final String? unavailableMessage;
  final bool isLocallyReserved;
}

class _VehicleDetailScreenState extends State<VehicleDetailScreen> {
  Future<_VehicleDetailData>? _detailFuture;

  late DateTime _startDate;
  late DateTime _endDate;

  static final _currency = NumberFormat.currency(symbol: '\$', decimalDigits: 0);
  static final _dateFormat = DateFormat('dd MMM yyyy', 'es');

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _startDate = DateTime(now.year, now.month, now.day + 1);
    _endDate = DateTime(now.year, now.month, now.day + 3);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _detailFuture ??= _loadDetail();
  }

  Future<_VehicleDetailData> _loadDetail() async {
    final api = context.read<MobileVehicleApiService>();
    final reservedService = context.read<LocalReservedVehicleService>();
    final catalog = context.read<CatalogProvider>();

    final reservedIds = catalog.reservedVehicleIds.isNotEmpty
        ? catalog.reservedVehicleIds
        : (await reservedService.getReservedVehicleIds()).toSet();

    final isLocallyReserved = reservedIds.contains(widget.vehicleId);

    final vehicle = await api.getVehicleById(widget.vehicleId);
    if (vehicle == null) {
      throw StateError('not_found');
    }

    if (isLocallyReserved) {
      return _VehicleDetailData(
        vehicle: vehicle,
        canAddToCart: false,
        isLocallyReserved: true,
        unavailableMessage: 'Este vehículo ya fue reservado recientemente.',
      );
    }

    try {
      final availability = await api.checkAvailability(widget.vehicleId);
      if (!availability.isAvailableForRent) {
        return _VehicleDetailData(
          vehicle: vehicle,
          canAddToCart: false,
          unavailableMessage: availability.mensaje.isNotEmpty
              ? availability.mensaje
              : 'Este vehículo no está disponible para reservar.',
        );
      }
    } catch (_) {
      // Si falla disponibilidad, usar estado del vehículo.
    }

    return _VehicleDetailData(
      vehicle: vehicle,
      canAddToCart: vehicle.canAddToCart,
    );
  }

  void _retry() {
    setState(() {
      _detailFuture = _loadDetail();
    });
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : _endDate;
    final first = isStart ? DateTime.now() : _startDate;
    final last = DateTime.now().add(const Duration(days: 365));

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: last,
    );

    if (picked == null) return;

    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_endDate.isBefore(_startDate)) {
          _endDate = _startDate.add(const Duration(days: 1));
        }
      } else {
        _endDate = picked.isBefore(_startDate) ? _startDate : picked;
      }
    });
  }

  Future<void> _addToCart(Vehicle vehicle) async {
    await context.read<CartProvider>().addVehicle(
          vehicle,
          startDate: _startDate,
          endDate: _endDate,
        );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${vehicle.displayName} agregado al carrito'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Detalle del vehículo'),
      ),
      body: FutureBuilder<_VehicleDetailData>(
        future: _detailFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            if (snapshot.error.toString().contains('not_found')) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Vehículo no encontrado'),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => context.pop(),
                      child: const Text('Volver'),
                    ),
                  ],
                ),
              );
            }

            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 56,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No se pudo cargar el vehículo',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _retry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            );
          }

          final detail = snapshot.data!;
          final vehicle = detail.vehicle;
          final days = _endDate.difference(_startDate).inDays + 1;
          final estimatedTotal = vehicle.pricePerDay * days;

          return SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: VehicleImagePlaceholder(
                            imageUrl: vehicle.imageUrl,
                            height: 220,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    vehicle.displayName,
                                    style: theme.textTheme.headlineSmall?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (vehicle.year > 0)
                                    Text(
                                      'Año ${vehicle.year}',
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            StatusChip.vehicle(status: vehicle.status),
                          ],
                        ),
                        if (detail.unavailableMessage != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.errorContainer
                                  .withValues(alpha: 0.6),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.block,
                                  size: 20,
                                  color: theme.colorScheme.onErrorContainer,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    detail.unavailableMessage!,
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onErrorContainer,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 20),
                        _InfoRow(
                          icon: Icons.category_outlined,
                          label: 'Categoría',
                          value: vehicle.category,
                        ),
                        if (vehicle.transmission != 'No especificado')
                          _InfoRow(
                            icon: Icons.settings_outlined,
                            label: 'Transmisión',
                            value: vehicle.transmission,
                          ),
                        if (vehicle.fuel != 'No especificado')
                          _InfoRow(
                            icon: Icons.local_gas_station_outlined,
                            label: 'Combustible',
                            value: vehicle.fuel,
                          ),
                        _InfoRow(
                          icon: Icons.attach_money,
                          label: 'Precio por día',
                          value: _currency.format(vehicle.pricePerDay),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Descripción',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          vehicle.description.isNotEmpty
                              ? vehicle.description
                              : 'Sin descripción disponible.',
                          style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          'Fechas de renta',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _DateSelector(
                                label: 'Inicio',
                                date: _dateFormat.format(_startDate),
                                onTap: detail.canAddToCart
                                    ? () => _pickDate(isStart: true)
                                    : () {},
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _DateSelector(
                                label: 'Fin',
                                date: _dateFormat.format(_endDate),
                                onTap: detail.canAddToCart
                                    ? () => _pickDate(isStart: false)
                                    : () {},
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '$days día${days == 1 ? '' : 's'} · Total estimado: ${_currency.format(estimatedTotal)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.tertiaryContainer
                                .withValues(alpha: 0.5),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.info_outline,
                                size: 20,
                                color: theme.colorScheme.onTertiaryContainer,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'La disponibilidad final se confirmará al crear la reserva.',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onTertiaryContainer,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: FilledButton.icon(
                    onPressed: detail.canAddToCart
                        ? () => _addToCart(vehicle)
                        : null,
                    icon: const Icon(Icons.add_shopping_cart),
                    label: Text(
                      detail.canAddToCart
                          ? 'Agregar al carrito'
                          : detail.isLocallyReserved
                              ? 'Ya reservado'
                              : vehicle.status.label,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DateSelector extends StatelessWidget {
  const _DateSelector({
    required this.label,
    required this.date,
    required this.onTap,
  });

  final String label;
  final String date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today, size: 18),
        ),
        child: Text(date),
      ),
    );
  }
}
