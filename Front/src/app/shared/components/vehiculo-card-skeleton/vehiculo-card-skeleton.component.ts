import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { fadeIn } from '@core/animations/motion';

/**
 * Skeleton screen para `<app-vehiculo-card>`.
 * Usa el shimmer turquesa global (clase `.skeleton` en `styles.css`).
 */
@Component({
  selector: 'app-vehiculo-card-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn],
  template: `
    @for (i of placeholders; track i) {
      <article class="card overflow-hidden flex flex-col" aria-hidden="true" [@fadeIn]>
        <div class="skeleton h-44 rounded-none"></div>
        <div class="p-5 flex flex-col gap-3 flex-1">
          <div class="skeleton h-5 w-3/5"></div>
          <div class="skeleton h-3 w-2/5"></div>
          <div class="grid grid-cols-3 gap-2 mt-1">
            <div class="skeleton h-3"></div>
            <div class="skeleton h-3"></div>
            <div class="skeleton h-3"></div>
          </div>
          <div class="skeleton h-3 w-1/2"></div>
          <div class="mt-auto flex items-end justify-between pt-2 gap-3">
            <div class="space-y-1.5 flex-1">
              <div class="skeleton h-2 w-12"></div>
              <div class="skeleton h-7 w-24"></div>
            </div>
            <div class="skeleton h-9 w-24"></div>
          </div>
        </div>
      </article>
    }
  `,
})
export class VehiculoCardSkeletonComponent {
  @Input() count = 6;

  protected get placeholders(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
