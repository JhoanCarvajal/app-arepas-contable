import { Injectable, signal } from '@angular/core';

export interface Submission {
  id?: number;
  createdAt: string;
  date: string;
  earnings: number;
  totalExpenses: number;
  netProfit: number;
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
