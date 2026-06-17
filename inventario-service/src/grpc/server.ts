import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { VehiculoRepository } from '../modules/vehiculos/vehiculo.repository.js';
import { createInventoryGrpcHandlers } from './inventory.service.js';
import { resolveInventoryProtoPath } from './proto-path.js';

interface InventoryGrpcPackage {
  inventory: {
    v1: {
      InventoryService: {
        service: grpc.ServiceDefinition;
      };
    };
  };
}

function loadInventoryPackage(): InventoryGrpcPackage {
  const packageDefinition = protoLoader.loadSync(resolveInventoryProtoPath(), {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(packageDefinition) as unknown as InventoryGrpcPackage;
}

export function startGrpcServer(repo: VehiculoRepository): void {
  try {
    const port = process.env.GRPC_PORT ?? '50052';
    const handlers = createInventoryGrpcHandlers(repo);
    const inventoryPkg = loadInventoryPackage();
    const server = new grpc.Server();

    server.addService(
      inventoryPkg.inventory.v1.InventoryService.service,
      handlers,
    );

    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, boundPort) => {
        if (err) {
          console.error('[inventario-service][grpc] Error al iniciar servidor gRPC:', err);
          return;
        }

        console.log(`[inventario-service][grpc] Servidor gRPC escuchando en 0.0.0.0:${boundPort}`);
      },
    );
  } catch (err) {
    console.error('[inventario-service][grpc] Error al configurar servidor gRPC:', err);
  }
}
