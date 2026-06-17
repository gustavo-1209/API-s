import path from 'path';

/** Ruta al proto compartido en la raíz del monorepo. */
export function resolveInventoryProtoPath(): string {
  return path.resolve(__dirname, '../../../proto/inventory/v1/inventory.proto');
}
