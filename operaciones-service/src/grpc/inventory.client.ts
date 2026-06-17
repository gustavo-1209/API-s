import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolveInventoryProtoPath } from './proto-path.js';

const GRPC_TIMEOUT_MS = 5_000;

export interface CheckVehicleAvailabilityParams {
  vehicleId: string;
  startDate: string;
  endDate: string;
  correlationId?: string;
}

export interface CheckVehicleAvailabilityResult {
  available: boolean;
  status: string;
  message: string;
}

export interface ReserveVehicleParams {
  vehicleId: string;
  reservationId: string;
  correlationId?: string;
}

export interface ReserveVehicleResult {
  success: boolean;
  status: string;
  message: string;
}

export interface ReleaseVehicleParams {
  vehicleId: string;
  reservationId: string;
  correlationId?: string;
}

export interface ReleaseVehicleResult {
  success: boolean;
  status: string;
  message: string;
}

interface InventoryServiceClient {
  checkVehicleAvailability(
    request: CheckVehicleAvailabilityParams,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<CheckVehicleAvailabilityResult>,
  ): void;
  reserveVehicle(
    request: ReserveVehicleParams,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<ReserveVehicleResult>,
  ): void;
  releaseVehicle(
    request: ReleaseVehicleParams,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<ReleaseVehicleResult>,
  ): void;
}

interface InventoryGrpcPackage {
  inventory: {
    v1: {
      InventoryService: new (
        address: string,
        credentials: grpc.ChannelCredentials,
      ) => InventoryServiceClient;
    };
  };
}

let cachedClient: InventoryServiceClient | null = null;

export function isInventoryGrpcConfigured(): boolean {
  return process.env.INVENTARIO_GRPC_URL !== undefined;
}

function getInventoryGrpcUrl(): string {
  const configured = process.env.INVENTARIO_GRPC_URL?.trim();
  return configured || 'localhost:50052';
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

function getClient(): InventoryServiceClient {
  if (!cachedClient) {
    const inventoryPkg = loadInventoryPackage();
    cachedClient = new inventoryPkg.inventory.v1.InventoryService(
      getInventoryGrpcUrl(),
      grpc.credentials.createInsecure(),
    );
  }
  return cachedClient;
}

function callOptions(): grpc.CallOptions {
  return { deadline: Date.now() + GRPC_TIMEOUT_MS };
}

function promisifyUnary<TRequest, TResponse>(
  invoke: (
    request: TRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<TResponse>,
  ) => void,
  request: TRequest,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    invoke(request, callOptions(), (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      if (!response) {
        reject(new Error('Respuesta gRPC vacía'));
        return;
      }
      resolve(response);
    });
  });
}

export async function checkVehicleAvailability(
  params: CheckVehicleAvailabilityParams,
): Promise<CheckVehicleAvailabilityResult> {
  const client = getClient();
  return promisifyUnary(
    client.checkVehicleAvailability.bind(client),
    params,
  );
}

export async function reserveVehicle(
  params: ReserveVehicleParams,
): Promise<ReserveVehicleResult> {
  const client = getClient();
  return promisifyUnary(client.reserveVehicle.bind(client), params);
}

export async function releaseVehicle(
  params: ReleaseVehicleParams,
): Promise<ReleaseVehicleResult> {
  const client = getClient();
  return promisifyUnary(client.releaseVehicle.bind(client), params);
}
