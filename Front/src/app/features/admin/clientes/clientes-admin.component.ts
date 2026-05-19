import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { AdminService } from '@core/services/admin.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import type { AuthUser } from '@core/models/api.models';

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, LucideAngularModule, EmptyStateComponent],
  template: `
    <section class="px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <header class="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p class="text-xs uppercase tracking-wider text-ink-soft">Panel administrativo</p>
          <h2 class="text-2xl font-semibold text-ink">Clientes</h2>
        </div>
        <span class="text-sm text-ink-muted">
          {{ total() }} cliente{{ total() !== 1 ? 's' : '' }}
        </span>
      </header>

      <!-- Búsqueda -->
      @if (!loading() && clientes().length > 0) {
        <div class="relative max-w-xs">
          <lucide-icon name="search"
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"></lucide-icon>
          <input type="search" placeholder="Buscar por nombre, email o cédula…"
                 class="input pl-9 text-sm w-full"
                 (input)="onSearch($event)" />
        </div>
      }

      <!-- Skeleton -->
      @if (loading()) {
        <div class="card overflow-hidden">
          <div class="divide-y divide-surface-border">
            @for (i of [0,1,2,3,4,5]; track i) {
              <div class="px-5 py-3.5 flex items-center gap-4" aria-hidden="true">
                <div class="skeleton w-8 h-8 rounded-full shrink-0"></div>
                <div class="flex flex-col gap-1.5 flex-1">
                  <div class="skeleton h-3 w-40"></div>
                  <div class="skeleton h-2.5 w-52"></div>
                </div>
                <div class="skeleton h-3 w-24"></div>
                <div class="skeleton h-5 w-16 rounded-full"></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Empty -->
      @else if (filtered().length === 0) {
        <app-empty-state
          icon="users"
          title="{{ query() ? 'Sin resultados' : 'Sin clientes registrados' }}"
          description="{{ query() ? 'Ningún cliente coincide con la búsqueda.' : 'Los clientes aparecerán aquí cuando se registren en la plataforma.' }}"
        />
      }

      <!-- Tabla -->
      @else {
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="bg-surface-muted border-b border-surface-border text-xs uppercase
                           tracking-wider text-ink-soft">
                  <th class="px-5 py-3 text-left font-medium">Cliente</th>
                  <th class="px-5 py-3 text-left font-medium">Cédula</th>
                  <th class="px-5 py-3 text-left font-medium">Teléfono</th>
                  <th class="px-5 py-3 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-border">
                @for (c of filtered(); track c.id) {
                  <tr class="hover:bg-surface-muted/50 transition-colors">
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-3">
                        <span class="grid place-items-center w-8 h-8 rounded-full
                                     bg-primary-50 text-primary-700 text-xs font-bold shrink-0">
                          {{ initials(c) }}
                        </span>
                        <div>
                          <p class="font-medium text-ink">{{ c.nombres }} {{ c.apellidos }}</p>
                          <p class="text-xs text-ink-muted">{{ c.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-3 text-ink-muted font-mono text-xs">
                      {{ c.cedula ?? '—' }}
                    </td>
                    <td class="px-5 py-3 text-ink-muted">{{ c.telefono ?? '—' }}</td>
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5
                                   text-xs font-medium"
                            [ngClass]="c.role === 'ADMIN'
                              ? 'bg-primary-50 text-primary-800 border-primary-200'
                              : 'bg-primary-700 text-white border-primary-800'">
                        {{ c.role === 'ADMIN' ? 'Admin' : 'Cliente' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>
  `,
})
export class AdminClientesComponent implements OnInit {
  private readonly admin$ = inject(AdminService);

  protected readonly loading  = signal(true);
  protected readonly clientes = signal<AuthUser[]>([]);
  protected readonly query    = signal('');
  protected readonly total    = computed(() => this.clientes().length);

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return this.clientes();
    return this.clientes().filter(
      (c) =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.cedula ?? '').includes(q),
    );
  });

  protected initials(c: AuthUser): string {
    return `${c.nombres?.[0] ?? ''}${c.apellidos?.[0] ?? ''}`.toUpperCase();
  }

  protected onSearch(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
  }

  ngOnInit(): void {
    this.admin$.clientes().subscribe({
      next:  (list) => { this.clientes.set(list); this.loading.set(false); },
      error: ()     => { this.loading.set(false); },
    });
  }
}
