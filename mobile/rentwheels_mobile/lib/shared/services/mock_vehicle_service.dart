import '../../mocks/mock_vehicles.dart';
import '../models/vehicle.dart';

class MockVehicleService {
  Future<List<Vehicle>> getVehicles() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return List.unmodifiable(mockVehicles);
  }

  Future<Vehicle?> getVehicleById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    try {
      return mockVehicles.firstWhere((v) => v.id == id);
    } catch (_) {
      return null;
    }
  }
}
