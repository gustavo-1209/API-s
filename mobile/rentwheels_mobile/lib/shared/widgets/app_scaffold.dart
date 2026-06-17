import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  static const _destinations = [
    (icon: Icons.home_outlined, selected: Icons.home, label: 'Inicio'),
    (
      icon: Icons.directions_car_outlined,
      selected: Icons.directions_car,
      label: 'Catálogo'
    ),
    (
      icon: Icons.shopping_cart_outlined,
      selected: Icons.shopping_cart,
      label: 'Carrito'
    ),
    (
      icon: Icons.event_note_outlined,
      selected: Icons.event_note,
      label: 'Reservas'
    ),
    (
      icon: Icons.person_outline,
      selected: Icons.person,
      label: 'Perfil'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: [
          for (final d in _destinations)
            NavigationDestination(
              icon: Icon(d.icon),
              selectedIcon: Icon(d.selected),
              label: d.label,
            ),
        ],
      ),
    );
  }
}
