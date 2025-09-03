import { Injectable, signal } from '@angular/core';

export interface Submission {
  createdAt: string;
  date: string;
  earnings: number;
  totalExpenses: number;
  netProfit: number;

  // Breakdown para edición posterior
  generalExpenses?: number | null;
  operatingExpenses?: number | null;
  workerExpenses?: number | null;
  rentExpenses?: number | null;
  motorcycleExpenses?: number | null;

  cornBags?: number | null;
  cornPrice?: number | null;

  charcoalBags?: number | null;
  charcoalPrice?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  history = signal<Submission[]>([]);
  private storageKey = 'registro-ganancias-history';

  constructor() {
    this.loadFromLocalStorage();
  }

  addSubmission(sub: Submission) {
    const s = { ...sub, createdAt: new Date().toISOString() };
    const updated = [s, ...this.history()];
    this.history.set(updated);
    this.saveToLocalStorage();
  }

  // Obtener un registro por createdAt (id)
  getSubmission(createdAt: string): Submission | undefined {
    return this.history().find(h => h.createdAt === createdAt);
  }

  // Actualizar un registro existente (por createdAt)
  updateSubmission(updated: Submission) {
    const idx = this.history().findIndex(h => h.createdAt === updated.createdAt);
    if (idx === -1) return;
    const copy = [...this.history()];
    copy[idx] = { ...updated };
    this.history.set(copy);
    this.saveToLocalStorage();
  }

  // Persistencia: localStorage
  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history()));
    } catch (e) {
      console.error('Error guardando en localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Submission[];
      this.history.set(parsed);
    } catch (e) {
      console.error('Error leyendo localStorage', e);
    }
  }
}
