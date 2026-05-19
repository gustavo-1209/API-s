import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <footer class="bg-dark text-white mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row
                  items-center justify-between gap-4">
        <div class="flex items-center gap-2 font-semibold">
          <span class="grid place-items-center w-8 h-8 rounded-lg bg-primary-700 text-white">
            <lucide-icon name="car" class="w-4 h-4"></lucide-icon>
          </span>
          UrbanCar EC
        </div>
        <p class="text-sm text-white/70">
          © {{ year }} UrbanCar Ecuador. Sistema de alquiler de autos.
        </p>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
