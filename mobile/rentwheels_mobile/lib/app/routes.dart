import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/cart/cart_screen.dart';
import '../features/catalog/catalog_screen.dart';
import '../features/home/home_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/reservations/reservations_screen.dart';
import '../features/vehicle_detail/vehicle_detail_screen.dart';
import '../shared/widgets/app_scaffold.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter createRouter() {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    routes: [
      GoRoute(
        path: '/',
        redirect: (_, _) => '/home',
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppScaffold(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: HomeScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/catalog',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: CatalogScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/cart',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: CartScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/reservations',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: ReservationsScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: ProfileScreen(),
                ),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/vehicle/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return VehicleDetailScreen(vehicleId: id);
        },
      ),
    ],
  );
}
