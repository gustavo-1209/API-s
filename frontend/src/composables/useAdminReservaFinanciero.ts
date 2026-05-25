import { isAxiosError } from 'axios';
import { adminApi, bookingApi } from '@/api/api';
import { unwrapApiList } from '@/lib/api-unwrap';
import {
  normalizeAdminFacturaDetalle,
  normalizeAdminPagoDetalle,
} from '@/mappers/admin.mapper';
import { normalizePaymentResponse, paymentStatusLabel } from '@/mappers/reserva.mapper';
import type { AdminFactura, AdminPago, ResumenPagoReserva } from '@/types/admin';

const MSG_PAGOS = 'No se pudieron cargar los pagos de esta reserva.';
const MSG_FACTURAS = 'No se pudieron cargar las facturas de esta reserva.';
const MSG_RESUMEN = 'No se pudo cargar el resumen de pago.';

function resolveSectionError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && !err.response) {
    return 'No se pudo conectar con el servidor.';
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

function formatTotalPagado(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export async function obtenerPagosPorReserva(reservaId: string): Promise<AdminPago[]> {
  const { data } = await adminApi.get<unknown>('/pagos', {
    params: { reservaId, page: 1, limit: 100 },
  });

  const rawList = unwrapApiList<unknown>(data);
  return rawList
    .map(normalizeAdminPagoDetalle)
    .filter((row): row is AdminPago => row !== null);
}

export async function obtenerFacturasPorReserva(reservaId: string): Promise<AdminFactura[]> {
  const { data } = await adminApi.get<unknown>('/facturas', {
    params: { reservaId, page: 1, limit: 100 },
  });

  const rawList = unwrapApiList<unknown>(data);
  return rawList
    .map(normalizeAdminFacturaDetalle)
    .filter((row): row is AdminFactura => row !== null);
}

/** Resumen booking; devuelve null si falla (no lanza). */
export async function obtenerResumenPago(reservaId: string): Promise<ResumenPagoReserva | null> {
  try {
    const { data } = await bookingApi.get<unknown>(`/payment/${reservaId}`);
    const payment = normalizePaymentResponse(data, reservaId);

    return {
      reservaId: payment.reservaId,
      status: payment.status,
      statusLabel: paymentStatusLabel(payment.status),
      totalPagado: formatTotalPagado(payment.totalPagado),
      cantidadPagos: payment.pagos.length,
    };
  } catch {
    return null;
  }
}

export interface CargarDetalleFinancieroResult {
  pagos: AdminPago[];
  pagosError: string | null;
  facturas: AdminFactura[];
  facturasError: string | null;
  resumenPago: ResumenPagoReserva | null;
  resumenPagoError: string | null;
}

/** Carga pagos, facturas y resumen en paralelo; errores aislados por sección. */
export async function cargarDetalleFinancieroReserva(
  reservaId: string,
): Promise<CargarDetalleFinancieroResult> {
  const [pagosSettled, facturasSettled, resumenSettled] = await Promise.allSettled([
    obtenerPagosPorReserva(reservaId),
    obtenerFacturasPorReserva(reservaId),
    obtenerResumenPago(reservaId),
  ]);

  let pagos: AdminPago[] = [];
  let pagosError: string | null = null;
  if (pagosSettled.status === 'fulfilled') {
    pagos = pagosSettled.value;
  } else {
    pagosError = resolveSectionError(pagosSettled.reason, MSG_PAGOS);
  }

  let facturas: AdminFactura[] = [];
  let facturasError: string | null = null;
  if (facturasSettled.status === 'fulfilled') {
    facturas = facturasSettled.value;
  } else {
    facturasError = resolveSectionError(facturasSettled.reason, MSG_FACTURAS);
  }

  let resumenPago: ResumenPagoReserva | null = null;
  let resumenPagoError: string | null = null;
  if (resumenSettled.status === 'fulfilled') {
    resumenPago = resumenSettled.value;
    if (!resumenPago) {
      resumenPagoError = MSG_RESUMEN;
    }
  } else {
    resumenPagoError = resolveSectionError(resumenSettled.reason, MSG_RESUMEN);
  }

  return {
    pagos,
    pagosError,
    facturas,
    facturasError,
    resumenPago,
    resumenPagoError,
  };
}
