import { decodeJwtPayload } from '@/lib/jwt';
import type { AuthUser } from '@/stores/auth';

type UserWithClienteFields = AuthUser & {
  cli_id?: string;
  clienteId?: string;
  cliente_id?: string;
};

/** Resuelve el ID de cliente desde el usuario o el JWT. */
export function resolveClienteId(user: AuthUser | null, token: string | null): string | null {
  if (user) {
    const u = user as UserWithClienteFields;
    const fromUser = u.clienteId ?? u.cliente_id ?? u.cli_id ?? u.id;
    if (fromUser) return fromUser;
  }

  if (token) {
    return decodeJwtPayload(token)?.id ?? null;
  }

  return null;
}
