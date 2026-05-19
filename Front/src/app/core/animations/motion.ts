import {
  animate, AnimationTriggerMetadata, query, stagger, style, transition, trigger,
} from '@angular/animations';

/** Fade + leve subida al entrar (200 ms ease-out). */
export const fadeUp: AnimationTriggerMetadata = trigger('fadeUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/** Fade simple al entrar (180 ms). */
export const fadeIn: AnimationTriggerMetadata = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('180ms ease-out', style({ opacity: 1 })),
  ]),
]);

/** Aparición escalonada de hijos (cards, items, etc.). */
export const stagger80: AnimationTriggerMetadata = trigger('stagger80', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(14px)' }),
      stagger(60, [
        animate('260ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

/** Slide horizontal cuando cambia el paso del stepper. */
export const slideStep: AnimationTriggerMetadata = trigger('slideStep', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(24px)' }),
    animate('240ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);
