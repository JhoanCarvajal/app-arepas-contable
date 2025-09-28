import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { WeeklyBalance } from '../models/weekly-balance.model';

@Injectable({
  providedIn: 'root',
})
export class WeeklyBalancesService {
  weeklyBalances = signal<WeeklyBalance[]>([]);
  private storageKey = 'registro-ganancias-weeklybalances';
  private apiService = inject(ApiService);

  constructor() {
    this.loadFromLocalStorage();
  }

  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.weeklyBalances().some(wb => wb.id === id));
    return id;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.weeklyBalances()));
    } catch (e) {
      console.error('Error guardando balances semanales en localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WeeklyBalance[];
      this.weeklyBalances.set(parsed);
    } catch (e) {
      console.error('Error leyendo balances semanales desde localStorage', e);
    }
  }

  getAll() {
    return this.weeklyBalances();
  }

  getById(id: number) {
    return this.weeklyBalances().find(wb => wb.id === id);
  }

  addWeeklyBalances(newBalances: WeeklyBalance[]) {
    const currentBalances = this.weeklyBalances();
    this.weeklyBalances.set([...currentBalances, ...newBalances]);
    this.saveToLocalStorage();
  }

  async addWeeklyBalance(balance: Partial<WeeklyBalance>) {
    const newBalance: WeeklyBalance = {
      id: this.generateUniqueId(),
      ...balance,
    } as WeeklyBalance;
    const updated = [newBalance, ...this.weeklyBalances()];
    this.weeklyBalances.set(updated);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.createWeeklyBalance(newBalance).pipe(
        tap(apiBalance => console.log('WeeklyBalance created on API:', apiBalance))
      ).subscribe({ error: err => console.error('Failed to create WeeklyBalance on API', err) });
    } else {
      console.log('Offline: WeeklyBalance saved locally, will sync later.');
    }
  }

  // async updateWeeklyBalance(updated: WeeklyBalance) {
  //   const idx = this.weeklyBalances().findIndex(wb => (updated.id !== undefined && wb.id === updated.id));
  //   if (idx === -1) return;
  //   const copy = [...this.weeklyBalances()];
  //   copy[idx] = { ...updated };
  //   this.weeklyBalances.set(copy);
  //   this.saveToLocalStorage();

  //   if (updated.id && await this.apiService.isOnlineAndApiAvailable()) {
  //     this.apiService.updateWeeklyBalance(updated.id, updated).pipe(
  //       tap(apiBalance => console.log('WeeklyBalance updated on API:', apiBalance))
  //     ).subscribe({ error: err => console.error('Failed to update WeeklyBalance on API', err) });
  //   } else {
  //     console.log('Offline: WeeklyBalance updated locally, will sync later.');
  //   }
  // }

  // async removeWeeklyBalance(id: number) {
  //   this.weeklyBalances.set(this.weeklyBalances().filter(wb => wb.id !== id));
  //   this.saveToLocalStorage();

  //   if (await this.apiService.isOnlineAndApiAvailable()) {
  //     this.apiService.deleteWeeklyBalance(id).pipe(
  //       tap(() => console.log('WeeklyBalance deleted on API:', id))
  //     ).subscribe({ error: err => console.error('Failed to delete WeeklyBalance on API', err) });
  //   } else {
  //     console.log('Offline: WeeklyBalance deleted locally, will sync later.');
  //   }
  // }
}
