import '../shared/models/vehicle.dart';

final List<Vehicle> mockVehicles = [
  Vehicle(
    id: 'v1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    category: 'Sedán',
    transmission: 'Automática',
    fuel: 'Gasolina',
    pricePerDay: 45.0,
    description:
        'Sedán confiable y eficiente, ideal para ciudad y carretera. Aire acondicionado, Bluetooth y asistencia de frenado.',
    status: VehicleStatus.disponible,
    imageUrl:
        'https://images.unsplash.com/photo-1621007947382-bcb3e01a9e1f?w=800',
  ),
  Vehicle(
    id: 'v2',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'SUV',
    transmission: 'Automática',
    fuel: 'Gasolina',
    pricePerDay: 65.0,
    description:
        'SUV espaciosa con excelente visibilidad y confort para familias. Tracción delantera y sensores de estacionamiento.',
    status: VehicleStatus.disponible,
    imageUrl:
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
  ),
  Vehicle(
    id: 'v3',
    brand: 'Kia',
    model: 'Rio',
    year: 2022,
    category: 'Compacto',
    transmission: 'Manual',
    fuel: 'Gasolina',
    pricePerDay: 35.0,
    description:
        'Compacto económico perfecto para desplazamientos urbanos. Bajo consumo y fácil de estacionar.',
    status: VehicleStatus.enProcesoReserva,
  ),
  Vehicle(
    id: 'v4',
    brand: 'Mazda',
    model: 'CX-5',
    year: 2023,
    category: 'SUV',
    transmission: 'Automática',
    fuel: 'Gasolina',
    pricePerDay: 70.0,
    description:
        'SUV premium con acabados de calidad y manejo ágil. Ideal para viajes largos con estilo.',
    status: VehicleStatus.enUso,
    imageUrl:
        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
  ),
  Vehicle(
    id: 'v5',
    brand: 'Chevrolet',
    model: 'Spark',
    year: 2021,
    category: 'Compacto',
    transmission: 'Manual',
    fuel: 'Gasolina',
    pricePerDay: 30.0,
    description:
        'El compacto más accesible de la flota. Perfecto para uso diario en la ciudad.',
    status: VehicleStatus.mantenimiento,
  ),
  Vehicle(
    id: 'v6',
    brand: 'Honda',
    model: 'CR-V',
    year: 2024,
    category: 'SUV',
    transmission: 'Automática',
    fuel: 'Híbrido',
    pricePerDay: 75.0,
    description:
        'SUV híbrida con bajo consumo y amplio espacio interior. Tecnología Honda Sensing incluida.',
    status: VehicleStatus.disponible,
    imageUrl:
        'https://images.unsplash.com/photo-1609521263047-f8f205293bb4?w=800',
  ),
  Vehicle(
    id: 'v7',
    brand: 'Nissan',
    model: 'Versa',
    year: 2023,
    category: 'Sedán',
    transmission: 'Automática',
    fuel: 'Gasolina',
    pricePerDay: 40.0,
    description:
        'Sedán accesible con buen espacio de maletero. Confortable para viajes de negocios.',
    status: VehicleStatus.disponible,
  ),
  Vehicle(
    id: 'v8',
    brand: 'Ford',
    model: 'Ranger',
    year: 2023,
    category: 'Pickup',
    transmission: 'Automática',
    fuel: 'Diésel',
    pricePerDay: 85.0,
    description:
        'Pickup robusta para trabajo o aventura. Capacidad de carga superior y tracción 4x4.',
    status: VehicleStatus.disponible,
    imageUrl:
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800',
  ),
];
