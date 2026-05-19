import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { NavbarComponent }    from '@shared/components/navbar/navbar.component';
import { FooterComponent }    from '@shared/components/footer/footer.component';
import { ToastHostComponent } from '@shared/components/toast-host/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastHostComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-surface-muted">
      @if (!hideChrome()) {
        <app-navbar />
      }
      <main class="flex-1 flex flex-col">
        <router-outlet />
      </main>
      @if (!hideChrome()) {
        <app-footer />
      }
    </div>
    <app-toast-host />
  `,
})
export class AppComponent {
  private readonly router = inject(Router);

  /** Signal que escucha NavigationEnd para detectar rutas /admin/*. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /**
   * El navbar/footer global se ocultan en `/admin/*`, ya que ese layout
   * tiene su propia chrome (sidebar + header).
   */
  protected readonly hideChrome = computed(() => this.currentUrl().startsWith('/admin'));
}
