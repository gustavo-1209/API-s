import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <section class="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10
                    bg-gradient-to-b from-primary-50 via-surface-muted to-white">
      <div class="w-full max-w-md card-pad">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-11 h-11 rounded-2xl bg-primary-700 text-white shadow-soft">
            <lucide-icon name="log-in" class="w-5 h-5"></lucide-icon>
          </span>
          <div>
            <h1 class="text-xl">Iniciar sesión</h1>
            <p class="text-sm text-ink-muted">Bienvenido de vuelta a UrbanCar EC.</p>
          </div>
        </div>

        @if (errorMsg()) {
          <div class="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50
                      text-danger px-3 py-2 text-sm">
            <lucide-icon name="alert-circle" class="w-4 h-4 mt-0.5 shrink-0"></lucide-icon>
            <span>{{ errorMsg() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
          <div>
            <label class="label" for="email">Correo electrónico</label>
            <div class="relative">
              <lucide-icon name="mail"
                class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"></lucide-icon>
              <input id="email" type="email" formControlName="email" autocomplete="email"
                     class="input pl-9" placeholder="tu@correo.com" />
            </div>
            @if (showError('email')) {
              <p class="error">Ingresa un correo válido.</p>
            }
          </div>

          <div>
            <label class="label" for="password">Contraseña</label>
            <div class="relative">
              <lucide-icon name="lock"
                class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"></lucide-icon>
              <input id="password" [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password"
                     class="input pl-9 pr-10" placeholder="••••••••" />
              <button type="button" (click)="togglePwd()"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg
                             text-ink-soft hover:text-primary-700"
                      [attr.aria-label]="showPwd() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <lucide-icon [name]="showPwd() ? 'eye-off' : 'eye'" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
            @if (showError('password')) {
              <p class="error">La contraseña es obligatoria.</p>
            }
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="loading()">
            @if (loading()) {
              <lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
              Ingresando…
            } @else {
              <lucide-icon name="log-in" class="w-4 h-4"></lucide-icon>
              Entrar
            }
          </button>
        </form>

        <p class="mt-6 text-sm text-ink-muted text-center">
          ¿Aún no tienes cuenta?
          <a routerLink="/auth/register" class="text-primary-700 font-semibold hover:underline">
            Regístrate aquí
          </a>
        </p>
      </div>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly toast  = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  protected readonly loading  = signal(false);
  protected readonly errorMsg = signal<string | null>(null);
  protected readonly showPwd  = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected togglePwd(): void { this.showPwd.update((v) => !v); }

  protected showError(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  protected submit(): void {
    this.errorMsg.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const isAdmin   = this.auth.isAdmin();
        const target    = isAdmin
          ? (returnUrl?.startsWith('/admin') ? returnUrl : '/admin')
          : (returnUrl ?? '/cliente');
        this.toast.success(
          `Bienvenido${isAdmin ? ', administrador' : ''}`,
          this.auth.displayName(),
        );
        void this.router.navigateByUrl(target);
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.loading.set(false);
        const msg = err?.error?.error?.message ?? 'No se pudo iniciar sesión.';
        this.errorMsg.set(msg);
        this.toast.error('Credenciales inválidas', msg);
      },
      complete: () => this.loading.set(false),
    });
  }
}
