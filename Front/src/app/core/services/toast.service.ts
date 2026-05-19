import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

/**
 * Servicio mínimo de notificaciones tipo "snackbar" en la esquina inferior.
 * Sin dependencias externas — visualizado por `<app-toast-host>`.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _items = signal<ToastMessage[]>([]);
  readonly items = this._items.asReadonly();

  private nextId = 1;

  success(title: string, detail?: string): void { this.show('success', title, detail); }
  error(title: string,   detail?: string): void { this.show('error',   title, detail); }
  info(title: string,    detail?: string): void { this.show('info',    title, detail); }

  dismiss(id: number): void {
    this._items.update((arr) => arr.filter((t) => t.id !== id));
  }

  private show(kind: ToastKind, title: string, detail?: string, durationMs = 4500): void {
    const id = this.nextId++;
    this._items.update((arr) => [...arr, { id, kind, title, detail }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
