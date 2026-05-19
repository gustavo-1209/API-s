import {
  ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CatalogosService } from '@core/services/catalogos.service';
import { VehiculosService } from '@core/services/vehiculos.service';
import { ReservasService } from '@core/services/reservas.service';
import { BookingStateService } from '@core/services/booking-state.service';
import { ToastService } from '@core/services/toast.service';
import type {
  CreateReservaRequest, Extra, Reserva, Seguro, Vehiculo,
} from '@core/models/api.models';
import { formatLong, formatUsd } from '@core/utils/date.utils';
import { fadeIn, fadeUp, slideStep } from '@core/animations/motion';

import { StepperComponent, type StepperStep } from '@shared/components/stepper/stepper.component';

@Component({
  selector: 'app-reserva',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass, ReactiveFormsModule, RouterLink,
    LucideAngularModule, StepperComponent,
  ],
  animations: [fadeIn, fadeUp, slideStep],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header class="mb-8 flex items-start justify-between gap-4 flex-wrap" [@fadeUp]>
        <div>
          <a routerLink="/marketplace" class="btn-ghost -ml-2 mb-1">
            <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
            Volver al catálogo
          </a>
          <h1 class="text-2xl sm:text-3xl font-semibold flex items-center gap-2">
            <lucide-icon name="list-checks" class="w-6 h-6 text-primary-700"></lucide-icon>
            Completa tu reserva
          </h1>
          <p class="text-sm text-ink-muted mt-1">{{ resumenFechas() }}</p>
        </div>
      </header>

      <div class="card-pad mb-8" [@fadeUp]>
        <app-stepper [steps]="STEPS" [current]="currentStep()" />
      </div>

      <!-- Estados especiales -->
      @if (loadingVehiculo()) {
        <div class="card-pad flex items-center gap-2 text-ink-muted" [@fadeIn]>
          <lucide-icon name="loader-2" class="w-4 h-4 animate-spin text-primary-700"></lucide-icon>
          Cargando vehículo…
        </div>
      } @else if (!vehiculo()) {
        <div class="card-pad text-danger flex items-start gap-3" [@fadeIn]>
          <lucide-icon name="alert-circle" class="w-5 h-5 mt-0.5"></lucide-icon>
          <div>
            <p class="font-medium">No pudimos cargar el vehículo seleccionado.</p>
            <a routerLink="/marketplace" class="btn-outline mt-3">
              Volver al catálogo
            </a>
          </div>
        </div>
      } @else {

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        <!-- COLUMNA PASOS -->
        <div>

          @switch (currentStep()) {

            <!-- ───────── PASO 1: Vehículo ───────── -->
            @case (1) {
              <article class="card overflow-hidden" [@slideStep]>
                <div class="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                  <div class="relative h-48 md:h-full bg-gradient-to-br from-primary-50 to-primary-100">
                    @if (showVehImage()) {
                      <img [src]="vehiculo()!.imagenUrl" [alt]="vehiculo()!.modelo?.nombre"
                           class="w-full h-full object-cover" loading="lazy"
                           (error)="onVehImageError()" />
                    } @else {
                      <div class="absolute inset-0 grid place-items-center text-primary-700">
                        <div class="flex flex-col items-center gap-1.5">
                          <lucide-icon name="car" class="w-14 h-14 opacity-70"></lucide-icon>
                          <span class="text-[10px] uppercase tracking-wider text-primary-800 font-semibold">
                            Sin imagen
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="p-6 flex flex-col gap-3">
                    <span class="badge-primary self-start">
                      <lucide-icon name="tag" class="w-3 h-3"></lucide-icon>
                      {{ vehiculo()!.categoria?.nombre ?? 'Vehículo' }}
                    </span>
                    <h2 class="text-xl font-semibold leading-tight">
                      {{ vehiculo()!.modelo?.marca?.nombre }}
                      <span class="text-ink-muted font-normal">
                        {{ vehiculo()!.modelo?.nombre }}
                      </span>
                    </h2>
                    <p class="text-xs text-ink-soft -mt-1">
                      {{ vehiculo()!.color }} · {{ vehiculo()!.anio }} ·
                      {{ vehiculo()!.placa }}
                    </p>

                    <ul class="grid grid-cols-3 gap-3 text-sm text-ink-muted mt-2">
                      <li class="flex items-center gap-2">
                        <lucide-icon name="users" class="w-4 h-4 text-primary-700"></lucide-icon>
                        {{ vehiculo()!.numeroPasajeros }} pax
                      </li>
                      <li class="flex items-center gap-2">
                        <lucide-icon name="fuel" class="w-4 h-4 text-primary-700"></lucide-icon>
                        {{ vehiculo()!.tipoCombustible?.nombre }}
                      </li>
                      <li class="flex items-center gap-2">
                        <lucide-icon name="gauge" class="w-4 h-4 text-primary-700"></lucide-icon>
                        {{ vehiculo()!.tipoTransmision?.nombre }}
                      </li>
                    </ul>

                    @if (vehiculo()!.agencia?.nombre; as ag) {
                      <p class="text-sm text-ink-muted flex items-center gap-2 mt-2">
                        <lucide-icon name="map-pin" class="w-4 h-4 text-primary-700"></lucide-icon>
                        Retiro en <strong class="text-ink">{{ ag }}</strong>
                      </p>
                    }

                    <div class="flex items-end justify-between mt-auto pt-4">
                      <div>
                        <p class="text-[11px] uppercase tracking-wider text-ink-soft">Precio</p>
                        <p class="text-2xl font-bold text-primary-700">
                          {{ formatUsd(vehiculo()!.precioDia) }}
                          <span class="text-xs font-medium text-ink-muted">/ día</span>
                        </p>
                      </div>
                      <a routerLink="/marketplace" class="btn-ghost">
                        Cambiar vehículo
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            }

            <!-- ───────── PASO 2: Extras y Seguro ───────── -->
            @case (2) {
              <div class="space-y-8" [@slideStep]>

                <article class="card-pad">
                  <header class="flex items-center justify-between mb-4">
                    <h2 class="font-semibold flex items-center gap-2">
                      <lucide-icon name="package" class="w-4 h-4 text-primary-700"></lucide-icon>
                      Extras y equipamiento
                    </h2>
                    <span class="text-xs text-ink-soft">Calculado por día</span>
                  </header>

                  @if (extras().length === 0) {
                    <p class="text-sm text-ink-muted">No hay extras disponibles.</p>
                  } @else {
                    <ul class="divide-y divide-surface-border">
                      @for (extra of extras(); track extra.id) {
                        <li class="py-3 flex items-center gap-4">
                          <div class="flex-1 min-w-0">
                            <p class="font-medium truncate">{{ extra.nombre }}</p>
                            @if (extra.descripcion) {
                              <p class="text-xs text-ink-soft truncate">{{ extra.descripcion }}</p>
                            }
                          </div>
                          <p class="text-sm font-semibold text-primary-700 w-20 text-right">
                            {{ formatUsd(extra.precioDia) }}
                            <span class="block text-[10px] font-normal text-ink-soft">/ día</span>
                          </p>
                          <div class="flex items-center gap-1">
                            <button type="button"
                                    (click)="changeExtra(extra, getExtraQty(extra.id) - 1)"
                                    class="grid place-items-center w-8 h-8 rounded-lg border
                                           border-surface-border hover:border-primary
                                           hover:text-primary-700 disabled:opacity-40"
                                    [disabled]="getExtraQty(extra.id) === 0"
                                    aria-label="Quitar uno">
                              <lucide-icon name="minus" class="w-4 h-4"></lucide-icon>
                            </button>
                            <span class="w-8 text-center text-sm font-semibold">
                              {{ getExtraQty(extra.id) }}
                            </span>
                            <button type="button"
                                    (click)="changeExtra(extra, getExtraQty(extra.id) + 1)"
                                    class="grid place-items-center w-8 h-8 rounded-lg border
                                           border-surface-border hover:border-primary
                                           hover:text-primary-700"
                                    aria-label="Añadir uno">
                              <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                            </button>
                          </div>
                        </li>
                      }
                    </ul>
                  }
                </article>

                <article class="card-pad">
                  <header class="flex items-center justify-between mb-4">
                    <h2 class="font-semibold flex items-center gap-2">
                      <lucide-icon name="shield" class="w-4 h-4 text-primary-700"></lucide-icon>
                      Cobertura / Seguro
                    </h2>
                    <span class="text-xs text-ink-soft">Opcional</span>
                  </header>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" (click)="selectSeguro(null)"
                            [ngClass]="seguroOptionClass(currentSeguroId() === null)"
                            class="text-left p-4 rounded-xl border transition-colors">
                      <p class="font-semibold">Sin seguro</p>
                      <p class="text-xs text-ink-muted mt-1">
                        Continuar con la cobertura básica del vehículo.
                      </p>
                    </button>
                    @for (s of seguros(); track s.id) {
                      <button type="button" (click)="selectSeguro(s)"
                              [ngClass]="seguroOptionClass(currentSeguroId() === s.id)"
                              class="text-left p-4 rounded-xl border transition-colors">
                        <div class="flex items-start justify-between gap-3">
                          <div class="min-w-0">
                            <p class="font-semibold truncate">{{ s.nombre }}</p>
                            @if (s.descripcion) {
                              <p class="text-xs text-ink-muted mt-1">{{ s.descripcion }}</p>
                            }
                          </div>
                          <p class="text-sm font-bold text-primary-700 whitespace-nowrap">
                            {{ formatUsd(s.precioDia) }}
                            <span class="block text-[10px] font-normal text-ink-soft text-right">
                              / día
                            </span>
                          </p>
                        </div>
                      </button>
                    }
                  </div>
                </article>
              </div>
            }

            <!-- ───────── PASO 3: Resumen y Confirmación ───────── -->
            @case (3) {
              <article class="card-pad space-y-6" [@slideStep]>
                <h2 class="font-semibold flex items-center gap-2">
                  <lucide-icon name="check-circle-2" class="w-4 h-4 text-primary-700"></lucide-icon>
                  Resumen final
                </h2>

                <div>
                  <p class="text-xs uppercase tracking-wider text-ink-soft mb-1">Vehículo</p>
                  <p class="font-medium">
                    {{ vehiculo()!.modelo?.marca?.nombre }} {{ vehiculo()!.modelo?.nombre }}
                    <span class="text-ink-muted">· {{ vehiculo()!.placa }}</span>
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs uppercase tracking-wider text-ink-soft mb-1">Retiro</p>
                    <p class="font-medium">{{ formatLong(state.criteria().fechaInicio) }}</p>
                    <p class="text-xs text-ink-soft">{{ state.criteria().horaRecogida }}</p>
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-wider text-ink-soft mb-1">Devolución</p>
                    <p class="font-medium">{{ formatLong(state.criteria().fechaFin) }}</p>
                    <p class="text-xs text-ink-soft">{{ state.criteria().horaDevolucion }}</p>
                  </div>
                </div>

                @if (selectedExtrasArr().length > 0) {
                  <div>
                    <p class="text-xs uppercase tracking-wider text-ink-soft mb-2">Extras</p>
                    <ul class="space-y-1 text-sm">
                      @for (e of selectedExtrasArr(); track e.extra.id) {
                        <li class="flex justify-between">
                          <span>{{ e.extra.nombre }} × {{ e.cantidad }}</span>
                          <span class="text-ink-muted">
                            {{ formatUsd(e.extra.precioDia * state.dias() * e.cantidad) }}
                          </span>
                        </li>
                      }
                    </ul>
                  </div>
                }

                @if (state.seguro(); as s) {
                  <div>
                    <p class="text-xs uppercase tracking-wider text-ink-soft mb-1">Seguro</p>
                    <p class="text-sm flex justify-between">
                      <span>{{ s.nombre }}</span>
                      <span class="text-ink-muted">{{ formatUsd(state.subtotalSeguro()) }}</span>
                    </p>
                  </div>
                }

                <div>
                  <label class="label" for="notas">Notas (opcional)</label>
                  <textarea id="notas" [formControl]="notas" class="input min-h-[80px]"
                            placeholder="Información adicional para la agencia"></textarea>
                </div>

                <div class="rounded-xl bg-primary-50 p-4 text-xs text-primary-800
                            flex items-start gap-2">
                  <lucide-icon name="info" class="w-4 h-4 mt-0.5 shrink-0"></lucide-icon>
                  <span>
                    El precio mostrado es preliminar. El backend recalcula el total
                    oficial al confirmar la reserva.
                  </span>
                </div>

                @if (errorMsg()) {
                  <div class="rounded-xl border border-red-200 bg-red-50 text-danger
                              px-3 py-2 text-sm flex items-start gap-2">
                    <lucide-icon name="alert-circle" class="w-4 h-4 mt-0.5"></lucide-icon>
                    <span>{{ errorMsg() }}</span>
                  </div>
                }
              </article>
            }
          }

          <!-- Navegación inferior -->
          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" class="btn-outline"
                    [disabled]="currentStep() === 1 || submitting()"
                    (click)="prevStep()">
              <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
              Anterior
            </button>

            @if (currentStep() < 3) {
              <button type="button" class="btn-primary" (click)="nextStep()">
                Continuar
                <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
              </button>
            } @else {
              <button type="button" class="btn-primary"
                      (click)="confirmar()" [disabled]="submitting()">
                @if (submitting()) {
                  <lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
                  Confirmando…
                } @else {
                  <lucide-icon name="check-circle-2" class="w-4 h-4"></lucide-icon>
                  Confirmar reserva
                }
              </button>
            }
          </div>
        </div>

        <!-- COLUMNA TOTALES -->
        <aside class="lg:sticky lg:top-20 h-fit" [@fadeUp]>
          <div class="card-pad space-y-3">
            <h3 class="font-semibold flex items-center gap-2">
              <lucide-icon name="file-text" class="w-4 h-4 text-primary-700"></lucide-icon>
              Resumen de costos
            </h3>

            <dl class="text-sm divide-y divide-surface-border">
              <div class="py-2 flex justify-between">
                <dt class="text-ink-muted">
                  Vehículo · {{ state.dias() }} {{ state.dias() === 1 ? 'día' : 'días' }}
                </dt>
                <dd class="font-medium">{{ formatUsd(state.subtotalDias()) }}</dd>
              </div>
              <div class="py-2 flex justify-between">
                <dt class="text-ink-muted">Extras</dt>
                <dd class="font-medium">{{ formatUsd(state.subtotalExtras()) }}</dd>
              </div>
              <div class="py-2 flex justify-between">
                <dt class="text-ink-muted">Seguro</dt>
                <dd class="font-medium">{{ formatUsd(state.subtotalSeguro()) }}</dd>
              </div>
              <div class="py-3 flex justify-between items-end">
                <dt class="font-semibold">Total estimado</dt>
                <dd class="text-xl font-bold text-primary-700">
                  {{ formatUsd(state.total()) }}
                </dd>
              </div>
            </dl>

            <p class="text-[11px] text-ink-soft">
              Impuestos incluidos. El cargo final lo determina el backend al confirmar.
            </p>
          </div>
        </aside>
      </div>
      }
    </section>
  `,
})
export class ReservaComponent implements OnInit {
  /** Inyectado vía `withComponentInputBinding()` desde la ruta `/reserva/:vehiculoId`. */
  @Input() vehiculoId?: string;

  protected readonly STEPS: StepperStep[] = [
    { index: 1, label: 'Vehículo',         icon: 'car' },
    { index: 2, label: 'Extras y seguros', icon: 'package' },
    { index: 3, label: 'Resumen',          icon: 'list-checks' },
  ];

  // Servicios
  protected readonly state    = inject(BookingStateService);
  private readonly catalogos  = inject(CatalogosService);
  private readonly vehiculos$ = inject(VehiculosService);
  private readonly reservas$  = inject(ReservasService);
  private readonly toast      = inject(ToastService);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);

  // Helpers de plantilla
  protected readonly formatLong = formatLong;
  protected readonly formatUsd  = formatUsd;

  // Estado del componente
  protected readonly currentStep    = signal<1 | 2 | 3>(1);
  protected readonly loadingVehiculo = signal(false);
  protected readonly submitting     = signal(false);
  protected readonly errorMsg       = signal<string | null>(null);

  protected readonly extras  = signal<Extra[]>([]);
  protected readonly seguros = signal<Seguro[]>([]);

  protected readonly notas = this.fb.nonNullable.control('');

  protected readonly vehiculo = this.state.vehiculo;

  /** Fallback de imagen del vehículo (igual lógica que `VehiculoCardComponent`). */
  protected readonly vehImageOk = signal(true);
  protected showVehImage(): boolean {
    return !!this.vehiculo()?.imagenUrl && this.vehImageOk();
  }
  protected onVehImageError(): void { this.vehImageOk.set(false); }

  protected readonly currentSeguroId = computed(() => this.state.seguro()?.id ?? null);

  protected readonly selectedExtrasArr = computed(() =>
    Array.from(this.state.extras().values()),
  );

  protected readonly resumenFechas = computed(() => {
    const c = this.state.criteria();
    return `${formatLong(c.fechaInicio)} · ${c.horaRecogida}  →  ${formatLong(c.fechaFin)} · ${c.horaDevolucion}`;
  });

  ngOnInit(): void {
    this.loadVehiculoIfNeeded();
    this.catalogos.extras().subscribe({
      next: (l) => this.extras.set(l), error: () => this.extras.set([]),
    });
    this.catalogos.seguros().subscribe({
      next: (l) => this.seguros.set(l), error: () => this.seguros.set([]),
    });
  }

  // ── Navegación entre pasos ────────────────────────────────
  protected nextStep(): void {
    const next = (this.currentStep() + 1) as 1 | 2 | 3;
    if (next > 3) return;
    this.currentStep.set(next);
  }
  protected prevStep(): void {
    const prev = (this.currentStep() - 1) as 1 | 2 | 3;
    if (prev < 1) return;
    this.currentStep.set(prev);
  }

  // ── Acciones de extras / seguros ──────────────────────────
  protected getExtraQty(extraId: string): number {
    return this.state.extras().get(extraId)?.cantidad ?? 0;
  }
  protected changeExtra(extra: Extra, qty: number): void {
    this.state.toggleExtra(extra, Math.max(0, qty));
  }
  protected selectSeguro(s: Seguro | null): void {
    this.state.setSeguro(s);
  }
  protected seguroOptionClass(active: boolean): string {
    return active
      ? 'border-primary bg-primary-50 ring-2 ring-primary/30'
      : 'border-surface-border hover:border-primary/60 bg-white';
  }

  // ── Confirmación de reserva ───────────────────────────────
  protected confirmar(): void {
    const v = this.vehiculo();
    if (!v) return;
    this.submitting.set(true);
    this.errorMsg.set(null);

    const c = this.state.criteria();
    const payload: CreateReservaRequest = {
      vehiculoId:  v.id,
      agenciaId:   v.agenciaId,
      fechaInicio: c.fechaInicio,
      fechaFin:    c.fechaFin,
      seguroId:    this.state.seguro()?.id,
      extras: this.selectedExtrasArr().map((e) => ({
        extraId: e.extra.id,
        cantidad: e.cantidad,
      })),
      notas: this.notas.value || undefined,
    };

    this.reservas$.create(payload).subscribe({
      next: (reserva: Reserva) => {
        this.submitting.set(false);
        this.state.clearSelection();
        this.toast.success(
          'Reserva creada',
          `${v.modelo?.marca?.nombre ?? ''} ${v.modelo?.nombre ?? ''} · ` +
          `código #${reserva.id.slice(0, 8).toUpperCase()} · falta el pago`,
        );
        void this.router.navigate(['/pago', reserva.id]);
      },
      error: (err: { error?: { error?: { message?: string } } }) => {
        this.submitting.set(false);
        const msg = err?.error?.error?.message ??
          'No se pudo crear la reserva. Verifica fechas y disponibilidad.';
        this.errorMsg.set(msg);
        this.toast.error('No se pudo crear la reserva', msg);
      },
    });
  }

  // ── Bootstrap del vehículo ────────────────────────────────
  private loadVehiculoIfNeeded(): void {
    const cached = this.state.vehiculo();
    if (cached && cached.id === this.vehiculoId) return;

    if (!this.vehiculoId) {
      this.state.setVehiculo(null);
      return;
    }
    this.loadingVehiculo.set(true);
    this.vehiculos$.getById(this.vehiculoId).subscribe({
      next: (v: Vehiculo) => {
        this.state.setVehiculo(v);
        this.loadingVehiculo.set(false);
      },
      error: () => {
        this.state.setVehiculo(null);
        this.loadingVehiculo.set(false);
      },
    });
  }
}
