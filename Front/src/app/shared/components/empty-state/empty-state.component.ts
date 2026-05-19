import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="card-pad text-center flex flex-col items-center gap-3 py-12">
      <span class="grid place-items-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-700">
        <lucide-icon [name]="icon" class="w-7 h-7"></lucide-icon>
      </span>
      <h3 class="text-lg font-semibold">{{ title }}</h3>
      @if (description) {
        <p class="text-sm text-ink-muted max-w-md">{{ description }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'info';
  @Input() title = 'Sin datos para mostrar';
  @Input() description: string | null = null;
}
