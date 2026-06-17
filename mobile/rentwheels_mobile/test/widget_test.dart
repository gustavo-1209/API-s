import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:rentwheels_mobile/app/app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('RentWheels home screen loads', (WidgetTester tester) async {
    await tester.pumpWidget(RentWheelsApp());
    await tester.pumpAndSettle();

    expect(find.text('RentWheels'), findsOneWidget);
    expect(find.text('Buscar vehículo'), findsOneWidget);
  });
}
