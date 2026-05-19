import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { ToastService, type ToastKind } from '@core/services/toast.service';
import { fadeUp } from '@core/animations/motion';

const TOAST_CLASS: Record<ToastKind, string> = {
  success: 'bg-white border-primary-200 text-ink',
  error:   'bg-white border-red-200 text-ink',
  info:    'bg-white border-surface-border text-ink',
};

const TOAST_ICON: Record<ToastKind, { name: string; cls: string }> = {
  success: { name: 'check-circle-2', cls: 'text-primary-700' },
  error:   { name: 'alert-circle',   cls: 'text-danger' },
  info:    { name: 'info',           cls: 'text-primary-700' },
};

@Component({
  selector: 'app-toast-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, LucideAngularModule],
  animations: [fadeUp],
  template: `
    <div class="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-full max-w-sm">
      @for (t of toast.items(); track t.id) {
        <div role="status" [@fadeUp]
             class="rounded-xl border shadow-card px-4 py-3 flex items-start gap-3"
             [ngClass]="cls(t.kind)">
          <lucide-icon [name]="icon(t.kind).name" [class]="'w-5 h-5 mt-0.5 ' + icon(t.kind).cls">
          </lucide-icon>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm">{{ t.title }}</p>
            @if (t.detail) {
              <p class="text-xs text-ink-muted mt-0.5">{{ t.detail }}</p>
            }
          </div>
          <button type="button" class="text-ink-soft hover:text-ink"
                  aria-label="Cerrar" (click)="toast.dismiss(t.id)">
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  protected readonly toast = inject(ToastService);

  protected cls(kind: ToastKind):  string                          { return TOAST_CLASS[kind]; }
  protected icon(kind: ToastKind): { name: string; cls: string }   { return TOAST_ICON[kind]; }
}
