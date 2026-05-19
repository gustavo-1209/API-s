import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface StepperStep {
  /** Identificador interno (1, 2, 3 …). */
  index: number;
  label: string;
  /** Nombre del icono Lucide (kebab-case). */
  icon?: string;
}

/**
 * Indicador de progreso del flujo de reserva (3 pasos por defecto).
 * Muestra el paso actual, los completados y los pendientes.
 */
@Component({
  selector: 'app-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, LucideAngularModule],
  template: `
    <ol class="flex items-center w-full gap-2 sm:gap-4">
      @for (step of steps; track step.index; let i = $index, last = $last) {
        <li class="flex-1 flex items-center gap-3 min-w-0">
          <div [ngClass]="circleClass(step.index)"
               class="grid place-items-center w-9 h-9 rounded-full border transition-colors shrink-0">
            @if (current > step.index) {
              <lucide-icon name="check-circle-2" class="w-5 h-5"></lucide-icon>
            } @else if (step.icon) {
              <lucide-icon [name]="step.icon" class="w-4 h-4"></lucide-icon>
            } @else {
              <span class="text-sm font-semibold">{{ step.index }}</span>
            }
          </div>
          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-wider text-ink-soft">Paso {{ step.index }}</p>
            <p [ngClass]="labelClass(step.index)"
               class="text-sm font-semibold truncate">{{ step.label }}</p>
          </div>
          @if (!last) {
            <div class="hidden sm:block flex-1 h-px"
                 [ngClass]="current > step.index
                   ? 'bg-primary-500'
                   : 'bg-surface-border'"></div>
          }
        </li>
      }
    </ol>
  `,
})
export class StepperComponent {
  @Input({ required: true }) steps: StepperStep[] = [];
  @Input({ required: true }) current = 1;

  protected circleClass(index: number): string {
    if (this.current === index) {
      return 'bg-primary-700 text-white border-primary-700 shadow-soft';
    }
    if (this.current > index) {
      return 'bg-primary-50 text-primary-700 border-primary-200';
    }
    return 'bg-white text-ink-soft border-surface-border';
  }

  protected labelClass(index: number): string {
    if (this.current === index) return 'text-primary-700';
    if (this.current > index)   return 'text-ink';
    return 'text-ink-soft';
  }
}
