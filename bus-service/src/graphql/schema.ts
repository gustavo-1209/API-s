export const typeDefs = `#graphql
  type Vehiculo {
    id: ID!
    nombre: String!
    descripcion: String
    precioPorDia: Float!
    moneda: String!
    categoria: String
    agenciaId: ID
    disponible: Boolean!
    status: String!
    imagenUrl: String
  }

  type DisponibilidadVehiculo {
    vehiculoId: ID!
    disponible: Boolean!
    status: String!
    mensaje: String!
  }

  type Reserva {
    id: ID!
    codigoReserva: String
    vehiculoId: ID
    clienteId: ID
    agenciaId: ID
    fechaInicio: String
    fechaFin: String
    diasTotal: Int
    totalAmount: Float!
    status: String
  }

  input CrearReservaInput {
    vehiculoId: ID!
    clienteId: ID!
    fechaInicio: String!
    fechaFin: String!
    agenciaId: ID
    """Opcional. Si no se envía, se usa header x-idempotency-key o se genera automáticamente."""
    idempotencyKey: ID
  }

  type CrearReservaPayload {
    reservaId: ID!
    codigoReserva: String
    estado: String!
    correlationId: ID
    reserva: Reserva
  }

  type CancelarReservaPayload {
    reservaId: ID!
    estado: String!
    reserva: Reserva
  }

  type Query {
    vehiculosDisponibles: [Vehiculo!]!
    vehiculo(id: ID!): Vehiculo
    disponibilidadVehiculo(id: ID!): DisponibilidadVehiculo!
    misReservas(clienteId: ID!): [Reserva!]!
  }

  type Mutation {
    crearReserva(input: CrearReservaInput!): CrearReservaPayload!
    cancelarReserva(id: ID!): CancelarReservaPayload!
  }
`;
