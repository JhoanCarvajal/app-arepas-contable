import { Injectable, signal } from '@angular/core';

export interface Submission {
  id?: number; // <-- nuevo id numérico
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

  // Genera un id numérico aleatorio y asegura que no exista colisión
  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.history().some(h => h.id === id));
    return id;
  }

  addSubmission(sub: Submission) {
    const s: Submission = {
      ...sub,
      id: sub.id ?? this.generateUniqueId(),
    };
    const updated = [s, ...this.history()];
    this.history.set(updated);
    this.saveToLocalStorage();
  }

  // Obtener un registro por createdAt (id histórico)
  getSubmission(createdAt: string): Submission | undefined {
    return this.history().find(h => h.createdAt === createdAt);
  }

  getSubmissionById(id: number): Submission | undefined {
    return this.history().find(h => h.id === id);
  }

  // Actualizar un registro existente (por createdAt o id)
  updateSubmission(updated: Submission) {
    const idx = this.history().findIndex(h => (updated.id !== undefined && h.id === updated.id));
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
