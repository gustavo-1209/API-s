import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../shared/services/auth_service.dart';
import '../shared/services/graphql_api_service.dart';
import '../shared/services/local_data_cleanup_service.dart';
import '../shared/services/local_cart_service.dart';
import '../shared/services/local_reservation_service.dart';
import '../shared/services/local_reserved_vehicle_service.dart';
import '../shared/services/mobile_reservation_api_service.dart';
import '../shared/services/mobile_vehicle_api_service.dart';
import '../shared/state/auth_provider.dart';
import '../shared/state/cart_provider.dart';
import '../shared/state/catalog_provider.dart';
import '../shared/state/reservation_provider.dart';
import 'routes.dart';
import 'theme.dart';

class RentWheelsApp extends StatelessWidget {
  RentWheelsApp({super.key});

  final _router = createRouter();

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<GraphQLApiService>(
          create: (_) => GraphQLApiService(),
        ),
        Provider<AuthService>(
          create: (_) => AuthService(),
        ),
        Provider<LocalReservedVehicleService>(
          create: (_) => LocalReservedVehicleService(),
        ),
        Provider<LocalDataCleanupService>(
          create: (context) => LocalDataCleanupService(
            LocalCartService(),
            LocalReservationService(),
            context.read<LocalReservedVehicleService>(),
          ),
        ),
        ChangeNotifierProvider(
          create: (context) =>
              AuthProvider(context.read<AuthService>())..loadSession(),
        ),
        ProxyProvider2<GraphQLApiService, AuthProvider, MobileVehicleApiService>(
          update: (_, graphql, auth, _) =>
              MobileVehicleApiService(graphql, auth),
        ),
        ProxyProvider<GraphQLApiService, MobileReservationApiService>(
          update: (_, graphql, _) => MobileReservationApiService(graphql),
        ),
        ChangeNotifierProvider(
          create: (_) => CartProvider(LocalCartService())..loadCart(),
        ),
        ChangeNotifierProxyProvider2<MobileVehicleApiService,
            LocalReservedVehicleService, CatalogProvider>(
          create: (context) => CatalogProvider(
            context.read<MobileVehicleApiService>(),
            context.read<LocalReservedVehicleService>(),
          )..loadCatalog(),
          update: (_, vehicleApi, reservedService, previous) =>
              previous ??
              CatalogProvider(vehicleApi, reservedService),
        ),
        ChangeNotifierProvider(
          create: (context) => ReservationProvider(
            LocalReservationService(),
            context.read<MobileVehicleApiService>(),
            context.read<MobileReservationApiService>(),
            context.read<AuthProvider>(),
            context.read<CatalogProvider>(),
          )..loadReservations(),
        ),
      ],
      child: MaterialApp.router(
        title: 'RentWheels',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        routerConfig: _router,
      ),
    );
  }
}
