import { Router, Request, Response, NextFunction } from 'express';
import { ReservaRepository } from '../reservas/reserva.repository.js';
import { correlationMiddleware } from '../../shared/middlewares/correlation.middleware.js';
import { idempotencyMiddleware } from '../../shared/middlewares/idempotency.middleware.js';
import { createReservaBooking } from './booking-create.shared.js';

export function createReservaBookingV2Router(reservaRepo: ReservaRepository): Router {
  const router = Router();

  router.use(correlationMiddleware);

  // POST /api/v2/gustavobenalcazar/reservas/booking
  router.post('/', idempotencyMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[booking-v2] crear reserva', {
        correlationId: req.correlationId,
        idempotencyKey: req.idempotencyKey,
      });

      const result = await createReservaBooking(
        reservaRepo,
        req.body,
        req.headers.authorization,
        { correlationId: req.correlationId },
      );

      if ('data' in result.body) {
        console.log('[booking-v2] reserva creada', {
          correlationId: req.correlationId,
          idempotencyKey: req.idempotencyKey,
          reservaId: result.body.data.id,
        });
      } else {
        console.log('[booking-v2] crear reserva rechazada', {
          correlationId: req.correlationId,
          idempotencyKey: req.idempotencyKey,
          status: result.status,
          code: result.body.error.code,
        });
      }

      res.status(result.status).json(result.body);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
