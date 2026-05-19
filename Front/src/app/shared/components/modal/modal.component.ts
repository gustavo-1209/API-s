import {
  ChangeDetectionStrategy, Component, EventEmitter, HostListener,
  Input, Output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { fadeIn, fadeUp } from '@core/animations/motion';

/**
 * Modal accesible y reutilizable.
 *
 *   <app-modal [open]="isOpen()" title="..." (closed)="...">
 *     <ng-container body>...</ng-container>
 *     <ng-container footer>...</ng-container>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  animations: [fadeIn, fadeUp],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 grid place-items-center px-4 py-6"
           role="dialog" aria-modal="true" [attr.aria-label]="title">
        <div class="absolute inset-0 bg-ink/60 backdrop-blur-sm"
             [@fadeIn] (click)="dismissOnBackdrop && closed.emit()"></div>

        <div class="relative w-full bg-white rounded-2xl shadow-card border
                    border-surface-border flex flex-col max-h-[90vh] overflow-hidden"
             [class]="sizeClass()" [@fadeUp]>
          <header class="flex items-start justify-between gap-4 p-5 border-b border-surface-border">
            <div>
              <h2 class="text-lg font-semibold text-ink">{{ title }}</h2>
              @if (subtitle) {
                <p class="text-sm text-ink-muted mt-0.5">{{ subtitle }}</p>
              }
            </div>
            <button type="button" class="btn-ghost -mr-2"
                    aria-label="Cerrar" (click)="closed.emit()">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </header>

          <div class="p-5 overflow-y-auto flex-1">
            <ng-content select="[body]"></ng-content>
          </div>

          <footer class="p-5 border-t border-surface-border bg-surface-muted
                         flex items-center justify-end gap-2">
            <ng-content select="[footer]"></ng-content>
          </footer>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle: string | null = null;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() dismissOnBackdrop = true;

  @Output() readonly closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEsc(): void { if (this.open) this.closed.emit(); }

  protected sizeClass(): string {
    return ({
      sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl',
    } as const)[this.size];
  }
}
