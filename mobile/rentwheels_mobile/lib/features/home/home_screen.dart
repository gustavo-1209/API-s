import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: _HeroHeader(colorScheme: colorScheme, theme: theme),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _BenefitsSection(theme: theme),
                const SizedBox(height: 32),
                _HowItWorksSection(theme: theme),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.colorScheme, required this.theme});

  final ColorScheme colorScheme;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colorScheme.primary,
            colorScheme.primary.withValues(alpha: 0.85),
            colorScheme.secondary,
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.directions_car, color: colorScheme.onPrimary, size: 32),
              const SizedBox(width: 10),
              Text(
                'RentWheels',
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Alquila el vehículo ideal para tu próximo viaje. Reserva rápida, autos verificados y atención confiable.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: colorScheme.onPrimary.withValues(alpha: 0.92),
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => context.go('/catalog'),
            icon: const Icon(Icons.search),
            label: const Text('Buscar vehículo'),
            style: FilledButton.styleFrom(
              backgroundColor: colorScheme.surface,
              foregroundColor: colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _BenefitsSection extends StatelessWidget {
  const _BenefitsSection({required this.theme});

  final ThemeData theme;

  static const _benefits = [
    (icon: Icons.bolt, title: 'Reserva rápida', subtitle: 'En minutos, sin complicaciones'),
    (icon: Icons.verified_user, title: 'Autos verificados', subtitle: 'Flota revisada y confiable'),
    (icon: Icons.shield, title: 'Atención segura', subtitle: 'Soporte durante tu renta'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Beneficios',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        for (final benefit in _benefits) ...[
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Icon(benefit.icon, color: theme.colorScheme.primary),
              ),
              title: Text(
                benefit.title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(benefit.subtitle),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _HowItWorksSection extends StatelessWidget {
  const _HowItWorksSection({required this.theme});

  final ThemeData theme;

  static const _steps = [
    'Elige un vehículo',
    'Agrégalo al carrito',
    'Crea tu reserva',
    'Recibe confirmación',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Cómo funciona',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                for (var i = 0; i < _steps.length; i++) ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: theme.colorScheme.primary,
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            color: theme.colorScheme.onPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            _steps[i],
                            style: theme.textTheme.bodyLarge,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (i < _steps.length - 1)
                    Padding(
                      padding: const EdgeInsets.only(left: 15, top: 4, bottom: 4),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          width: 2,
                          height: 16,
                          color: theme.colorScheme.outlineVariant,
                        ),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
