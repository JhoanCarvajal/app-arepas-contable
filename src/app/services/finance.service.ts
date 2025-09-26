import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

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
  private apiService = inject(ApiService);

  constructor() {
    this.loadFromLocalStorage();
  }

  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.history().some(h => h.id === id));
    return id;
  }

  addRecords(newRecords: Submission[]) {
    const currentRecords = this.history();
    this.history.set([...currentRecords, ...newRecords]);
    this.saveToLocalStorage();
  }

  addSubmission(sub: Submission) {
    const s: Submission = {
      ...sub,
      id: sub.id ?? this.generateUniqueId(),
    };
    const updated = [s, ...this.history()];
    this.history.set(updated);
    this.saveToLocalStorage();

    this.apiService.createHistory(s).pipe(
      tap(apiHistory => console.log('History created on API:', apiHistory))
    ).subscribe({ error: err => console.error('Failed to create history on API', err) });
  }

  getSubmission(createdAt: string): Submission | undefined {
    return this.history().find(h => h.createdAt === createdAt);
  }

  getSubmissionById(id: number): Submission | undefined {
    return this.history().find(h => h.id === id);
  }

  updateSubmission(updated: Submission) {
    const idx = this.history().findIndex(h => (updated.id !== undefined && h.id === updated.id));
    if (idx === -1) return;
    const copy = [...this.history()];
    copy[idx] = { ...updated };
    this.history.set(copy);
    this.saveToLocalStorage();

    if (updated.id) {
      this.apiService.updateHistory(updated.id, updated).pipe(
        tap(apiHistory => console.log('History updated on API:', apiHistory))
      ).subscribe({ error: err => console.error('Failed to update history on API', err) });
    }
  }

  removeSubmission(id: number) {
    this.history.set(this.history().filter(h => h.id !== id));
    this.saveToLocalStorage();

    this.apiService.deleteHistory(id).pipe(
      tap(() => console.log('History deleted on API:', id))
    ).subscribe({ error: err => console.error('Failed to delete history on API', err) });
  }

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

  getAll() {
    return this.history();
  }
}
