import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Paginador accesible y reutilizable basado en **signal inputs**.
 *
 * Uso:
 *   <app-paginator
 *      [total]="total()" [page]="page()" [limit]="limit()"
 *      (pageChange)="page.set($event)"
 *      (limitChange)="limit.set($event)" />
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    @if (total() > 0) {
      <nav class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
                  px-4 py-3 border-t border-surface-border bg-white"
           role="navigation" aria-label="Paginación">
        <p class="text-xs text-ink-muted">
          Mostrando <strong class="text-ink">{{ from() }}–{{ to() }}</strong>
          de <strong class="text-ink">{{ total() }}</strong> registros
        </p>

        <div class="flex items-center gap-2">
          <label for="paginator-size" class="text-xs text-ink-muted hidden sm:inline">
            Filas
          </label>
          <select id="paginator-size" [value]="limit()"
                  (change)="onLimit($event)"
                  class="rounded-lg border border-surface-border bg-white px-2 py-1
                         text-xs text-ink focus:border-primary-700
                         focus:ring-2 focus:ring-primary/30 outline-none">
            @for (s of sizes(); track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>

          <div class="flex items-center gap-1">
            <button type="button"
                    class="grid place-items-center w-8 h-8 rounded-lg border
                           border-surface-border text-ink-muted
                           hover:border-primary-700 hover:text-primary-700
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    [disabled]="page() <= 1"
                    (click)="goto(page() - 1)" aria-label="Página anterior">
              <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
            </button>
            <span class="text-xs font-medium text-ink-muted px-2 min-w-[68px] text-center">
              {{ page() }} / {{ totalPages() }}
            </span>
            <button type="button"
                    class="grid place-items-center w-8 h-8 rounded-lg border
                           border-surface-border text-ink-muted
                           hover:border-primary-700 hover:text-primary-700
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    [disabled]="page() >= totalPages()"
                    (click)="goto(page() + 1)" aria-label="Página siguiente">
              <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>
      </nav>
    }
  `,
})
export class PaginatorComponent {
  total = input.required<number>();
  page  = input(1);
  limit = input(20);
  sizes = input<number[]>([10, 20, 50, 100]);

  pageChange  = output<number>();
  limitChange = output<number>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.limit()))),
  );
  protected readonly from = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1,
  );
  protected readonly to = computed(() =>
    Math.min(this.total(), this.page() * this.limit()),
  );

  protected goto(p: number): void {
    const next = Math.min(this.totalPages(), Math.max(1, p));
    if (next !== this.page()) this.pageChange.emit(next);
  }

  protected onLimit(ev: Event): void {
    const next = Number((ev.target as HTMLSelectElement).value);
    if (next > 0) {
      this.limitChange.emit(next);
      this.pageChange.emit(1); // resetear a la primera página al cambiar limit
    }
  }
}
