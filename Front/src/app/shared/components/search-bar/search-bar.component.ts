import {
  ChangeDetectionStrategy, Component, computed, EventEmitter, inject,
  Input, OnInit, Output, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { CatalogosService } from '@core/services/catalogos.service';
import { BookingStateService, type SearchCriteria } from '@core/services/booking-state.service';
import { addDaysIso, todayIso } from '@core/utils/date.utils';
import type { Ciudad } from '@core/models/api.models';
import { fadeUp } from '@core/animations/motion';

/**
 * Buscador horizontal "flotante" (Localiza-style) que vive sobre el hero.
 *
 * Validaciones:
 *  - `fechaInicio >= hoy`     (no fechas pasadas)
 *  - `fechaFin > fechaInicio` (rango válido)
 *  - Ciudad y horas obligatorias
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, ReactiveFormsModule, LucideAngularModule],
  animations: [fadeUp],
  template: `
    <div class="card-pad shadow-card border-surface-border" [@fadeUp]
         [ngClass]="floating ? 'rounded-2xl' : 'rounded-xl'">
      <form [formGroup]="form" (ngSubmit)="emitSearch()"
            class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 items-end">

        <!-- Ciudad -->
        <div class="md:col-span-3">
          <label class="label" for="sb-ciudad">
            <lucide-icon name="map-pin" class="inline w-3.5 h-3.5 -mt-0.5 text-primary-700"></lucide-icon>
            Ciudad de retiro
          </label>
          <select id="sb-ciudad" formControlName="ciudadId" class="input">
            <option [ngValue]="null">Todas las ciudades</option>
            @for (c of ciudades(); track c.id) {
              <option [ngValue]="c.id">{{ c.nombre }}</option>
            }
          </select>
        </div>

        <!-- Fecha inicio -->
        <div class="md:col-span-2">
          <label class="label" for="sb-fechaInicio">
            <lucide-icon name="calendar" class="inline w-3.5 h-3.5 -mt-0.5 text-primary-700"></lucide-icon>
            Retiro
          </label>
          <input id="sb-fechaInicio" type="date" formControlName="fechaInicio"
                 [min]="todayIso" class="input" />
        </div>

        <!-- Hora inicio -->
        <div class="md:col-span-1">
          <label class="label" for="sb-horaRecogida">
            <lucide-icon name="clock" class="inline w-3.5 h-3.5 -mt-0.5 text-primary-700"></lucide-icon>
            Hora
          </label>
          <input id="sb-horaRecogida" type="time" formControlName="horaRecogida"
                 step="900" class="input" />
        </div>

        <!-- Fecha fin -->
        <div class="md:col-span-2">
          <label class="label" for="sb-fechaFin">
            <lucide-icon name="calendar" class="inline w-3.5 h-3.5 -mt-0.5 text-primary-700"></lucide-icon>
            Devolución
          </label>
          <input id="sb-fechaFin" type="date" formControlName="fechaFin"
                 [min]="minFechaFin()" class="input" />
        </div>

        <!-- Hora fin -->
        <div class="md:col-span-1">
          <label class="label" for="sb-horaDevolucion">
            <lucide-icon name="clock" class="inline w-3.5 h-3.5 -mt-0.5 text-primary-700"></lucide-icon>
            Hora
          </label>
          <input id="sb-horaDevolucion" type="time" formControlName="horaDevolucion"
                 step="900" class="input" />
        </div>

        <!-- Submit -->
        <div class="md:col-span-3 flex md:justify-end">
          <button type="submit" class="btn-primary w-full md:w-auto md:px-6"
                  [disabled]="form.invalid || hasDateError()">
            <lucide-icon name="search" class="w-4 h-4"></lucide-icon>
            {{ submitLabel }}
          </button>
        </div>

        @if (hasDateError()) {
          <div class="md:col-span-12 flex items-center gap-2 text-danger text-xs">
            <lucide-icon name="alert-circle" class="w-3.5 h-3.5"></lucide-icon>
            <span>{{ dateErrorMsg() }}</span>
          </div>
        }
      </form>
    </div>
  `,
})
export class SearchBarComponent implements OnInit {
  /** Si es `true`, aplica estilos de "tarjeta flotante" sobre el hero. */
  @Input() floating = false;
  @Input() submitLabel = 'Buscar autos';
  @Output() readonly search = new EventEmitter<SearchCriteria>();

  private readonly fb         = inject(FormBuilder);
  private readonly state      = inject(BookingStateService);
  private readonly catalogos  = inject(CatalogosService);

  protected readonly todayIso = todayIso();
  protected readonly ciudades = signal<Ciudad[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    ciudadId:        this.fb.control<string | null>(null),
    fechaInicio:     this.fb.nonNullable.control(this.state.criteria().fechaInicio, [Validators.required]),
    fechaFin:        this.fb.nonNullable.control(this.state.criteria().fechaFin,    [Validators.required]),
    horaRecogida:    this.fb.nonNullable.control(this.state.criteria().horaRecogida, [Validators.required]),
    horaDevolucion:  this.fb.nonNullable.control(this.state.criteria().horaDevolucion, [Validators.required]),
  });

  /** Mínimo permitido para la fecha de devolución (= fechaInicio + 1 día). */
  protected readonly minFechaFin = computed(() => {
    const start = this.form.controls.fechaInicio.value || this.todayIso;
    return addDaysIso(start, 1);
  });

  ngOnInit(): void {
    const c = this.state.criteria();
    this.form.patchValue({ ciudadId: c.ciudadId }, { emitEvent: false });

    this.catalogos.ciudades().subscribe({
      next: (list) => this.ciudades.set(list),
      error: () => this.ciudades.set([]),
    });

    // Auto-corrección: si fechaInicio sube por encima de fechaFin, ajustamos.
    this.form.controls.fechaInicio.valueChanges.subscribe((start) => {
      const end = this.form.controls.fechaFin.value;
      if (start && (!end || end <= start)) {
        this.form.patchValue({ fechaFin: addDaysIso(start, 1) }, { emitEvent: false });
      }
    });
  }

  // ── Validaciones cruzadas ─────────────────────────────────
  protected hasDateError(): boolean {
    return this.dateErrorMsg() !== null;
  }

  protected dateErrorMsg(): string | null {
    const { fechaInicio, fechaFin } = this.form.getRawValue();
    if (!fechaInicio || !fechaFin) return null;
    if (fechaInicio < this.todayIso) return 'La fecha de retiro no puede ser anterior a hoy.';
    if (fechaFin <= fechaInicio)     return 'La devolución debe ser posterior al retiro.';
    return null;
  }

  protected emitSearch(): void {
    if (this.form.invalid || this.hasDateError()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const next: Partial<SearchCriteria> = {
      ciudadId:       value.ciudadId,
      fechaInicio:    value.fechaInicio,
      fechaFin:       value.fechaFin,
      horaRecogida:   value.horaRecogida,
      horaDevolucion: value.horaDevolucion,
    };
    this.state.setCriteria(next);
    this.search.emit(this.state.criteria());
  }
}
