import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges,
  Output, signal, type SimpleChanges,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import type { Vehiculo } from '@core/models/api.models';
import { formatUsd } from '@core/utils/date.utils';
import { fadeUp } from '@core/animations/motion';

@Component({
  selector: 'app-vehiculo-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  animations: [fadeUp],
  template: `
    <article class="card overflow-hidden flex flex-col group" [@fadeUp]>
      <!-- Cabecera con imagen / placeholder + fallback automático -->
      <div class="relative h-44 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        @if (showImage()) {
          <img [src]="vehiculo.imagenUrl" [alt]="modeloLabel"
               class="w-full h-full object-cover transition-transform duration-500
                      group-hover:scale-105"
               loading="lazy" decoding="async"
               (error)="onImageError()" (load)="onImageLoad()" />
        } @else {
          <div class="absolute inset-0 grid place-items-center text-primary-700">
            <div class="flex flex-col items-center gap-1.5">
              <lucide-icon name="car" class="w-14 h-14 opacity-70"></lucide-icon>
              <span class="text-[10px] uppercase tracking-wider text-primary-800 font-semibold">
                Sin imagen disponible
              </span>
            </div>
          </div>
        }

        @if (vehiculo.categoria?.nombre; as catName) {
          <span class="absolute top-3 left-3 badge-primary backdrop-blur bg-white/90">
            <lucide-icon name="tag" class="w-3 h-3"></lucide-icon>
            {{ catName }}
          </span>
        }
      </div>

      <!-- Contenido -->
      <div class="p-5 flex flex-col gap-3 flex-1">
        <header>
          <h3 class="text-lg font-semibold leading-tight">
            {{ marcaLabel }} <span class="text-ink-muted font-normal">{{ modeloLabel }}</span>
          </h3>
          <p class="text-xs text-ink-soft mt-0.5">
            {{ vehiculo.color }} · {{ vehiculo.anio }}
            @if (vehiculo.placa) { · {{ vehiculo.placa }} }
          </p>
        </header>

        <ul class="grid grid-cols-3 gap-2 text-xs text-ink-muted">
          <li class="flex items-center gap-1.5">
            <lucide-icon name="users" class="w-3.5 h-3.5 text-primary-700"></lucide-icon>
            {{ vehiculo.numeroPasajeros }} pax
          </li>
          <li class="flex items-center gap-1.5">
            <lucide-icon name="fuel" class="w-3.5 h-3.5 text-primary-700"></lucide-icon>
            {{ vehiculo.tipoCombustible?.nombre ?? '—' }}
          </li>
          <li class="flex items-center gap-1.5">
            <lucide-icon name="gauge" class="w-3.5 h-3.5 text-primary-700"></lucide-icon>
            {{ vehiculo.tipoTransmision?.nombre ?? '—' }}
          </li>
        </ul>

        @if (vehiculo.agencia?.nombre; as ag) {
          <p class="text-xs text-ink-soft flex items-center gap-1.5">
            <lucide-icon name="map-pin" class="w-3.5 h-3.5"></lucide-icon>
            {{ ag }}
          </p>
        }

        <div class="mt-auto flex items-end justify-between pt-2">
          <div>
            <p class="text-[11px] uppercase tracking-wider text-ink-soft">Desde</p>
            <p class="text-2xl font-bold text-primary-700 leading-tight">
              {{ precioFmt }}
              <span class="text-xs font-medium text-ink-muted">/ día</span>
            </p>
          </div>
          <button type="button" (click)="rent.emit(vehiculo)" class="btn-primary">
            Alquilar
            <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>
    </article>
  `,
})
export class VehiculoCardComponent implements OnChanges {
  @Input({ required: true }) vehiculo!: Vehiculo;
  @Output() readonly rent = new EventEmitter<Vehiculo>();

  /** `true` mientras la imagen siga siendo válida (no haya disparado `error`). */
  protected readonly imageOk = signal(true);

  /** Mostrar `<img>` sólo si el vehículo trae URL y aún no falló. */
  protected showImage(): boolean {
    return !!this.vehiculo?.imagenUrl && this.imageOk();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Resetear el flag al cambiar de vehículo (uso en listas reutilizables).
    if (changes['vehiculo']) this.imageOk.set(true);
  }

  protected onImageError(): void { this.imageOk.set(false); }
  protected onImageLoad():  void { /* no-op (hook por si quieres animación) */ }

  protected get marcaLabel(): string {
    return this.vehiculo.modelo?.marca?.nombre ?? '';
  }
  protected get modeloLabel(): string {
    return this.vehiculo.modelo?.nombre ?? 'Vehículo';
  }
  protected get precioFmt(): string {
    return formatUsd(this.vehiculo.precioDia);
  }
}
