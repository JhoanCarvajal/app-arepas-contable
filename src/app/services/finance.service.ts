import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
// Removed: import { SyncService } from './sync.service'; // Import SyncService

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
  // Removed: private syncService = inject(SyncService); // Inject SyncService

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

  async addSubmission(sub: Submission) { // Make async
    const s: Submission = {
      ...sub,
      id: sub.id ?? this.generateUniqueId(),
    };
    const updated = [s, ...this.history()];
    this.history.set(updated);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.createHistory(s).pipe(
        tap(apiHistory => console.log('History created on API:', apiHistory))
      ).subscribe({ error: err => console.error('Failed to create history on API', err) });
    } else {
      console.log('Offline: History saved locally, will sync later.');
    }
  }

  getSubmission(createdAt: string): Submission | undefined {
    return this.history().find(h => h.createdAt === createdAt);
  }

  getSubmissionById(id: number): Submission | undefined {
    return this.history().find(h => h.id === id);
  }

  async updateSubmission(updated: Submission) { // Make async
    const idx = this.history().findIndex(h => (updated.id !== undefined && h.id === updated.id));
    if (idx === -1) return;
    const copy = [...this.history()];
    copy[idx] = { ...updated };
    this.history.set(copy);
    this.saveToLocalStorage();

    if (updated.id && await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.updateHistory(updated.id, updated).pipe(
        tap(apiHistory => console.log('History updated on API:', apiHistory))
      ).subscribe({ error: err => console.error('Failed to update history on API', err) });
    } else {
      console.log('Offline: History updated locally, will sync later.');
    }
  }

  async removeSubmission(id: number) { // Make async
    this.history.set(this.history().filter(h => h.id !== id));
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.deleteHistory(id).pipe(
        tap(() => console.log('History deleted on API:', id))
      ).subscribe({ error: err => console.error('Failed to delete history on API', err) });
    } else {
      console.log('Offline: History deleted locally, will sync later.');
    }
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
