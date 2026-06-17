import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../shared/services/local_cart_service.dart';
import '../shared/services/local_reservation_service.dart';
import '../shared/state/cart_provider.dart';
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
        ChangeNotifierProvider(
          create: (_) => CartProvider(LocalCartService())..loadCart(),
        ),
        ChangeNotifierProvider(
          create: (_) =>
              ReservationProvider(LocalReservationService())..loadReservations(),
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
