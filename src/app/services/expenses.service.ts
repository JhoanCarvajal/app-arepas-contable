import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { WeeklyBalance } from '../models/weekly-balance.model';

export interface Expense {
  id?: number;
  weeklyBalance: number | null;
  date: string;
  earnings: number;
  createdAt: string;
  totalExpenses: number;
  netProfit: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  expenses = signal<Expense[]>([]);
  private storageKey = 'registro-ganancias-expenses';
  private apiService = inject(ApiService);

  constructor() {
    this.loadFromLocalStorage();
  }

  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.expenses().some(e => e.id === id));
    return id;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.expenses()));
    } catch (e) {
      console.error('Error guardando expenses en localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Expense[];
      this.expenses.set(parsed);
    } catch (e) {
      console.error('Error leyendo expenses desde localStorage', e);
    }
  }

  getAll() {
    return this.expenses();
  }

  getById(id: number) {
    return this.expenses().find(e => e.id === id);
  }

  addExpenses(newExpenses: Expense[]) {
    const currentExpenses = this.expenses();
    this.expenses.set([...currentExpenses, ...newExpenses]);
    this.saveToLocalStorage();
  }

  async addExpense(expense: Partial<Expense>) {
    const newExpense: Expense = {
      ...expense,
      id: this.generateUniqueId(),
      weeklyBalance: expense.weeklyBalance ?? null,
    } as Expense;
    const updated = [newExpense, ...this.expenses()];
    this.expenses.set(updated);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.createExpense(newExpense).pipe(
        tap(apiExpense => console.log('Expense created on API:', apiExpense))
      ).subscribe({ error: err => console.error('Failed to create expense on API', err) });
    } else {
      console.log('Offline: Expense saved locally, will sync later.');
    }
    return newExpense;
  }

  async updateExpense(updated: Expense) {
    const idx = this.expenses().findIndex(e => (updated.id !== undefined && e.id === updated.id));
    if (idx === -1) return;
    const copy = [...this.expenses()];
    copy[idx] = { ...updated };
    this.expenses.set(copy);
    this.saveToLocalStorage();

    if (updated.id && await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.updateExpense(updated.id, updated).pipe(
        tap(apiExpense => console.log('Expense updated on API:', apiExpense))
      ).subscribe({ error: err => console.error('Failed to update expense on API', err) });
    } else {
      console.log('Offline: Expense updated locally, will sync later.');
    }
  }

  async removeExpense(id: number) {
    this.expenses.update(expenses => expenses.filter(e => e.id !== id));
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.deleteExpense(id).pipe(
        tap(() => console.log('Expense soft-deleted on API:', id))
      ).subscribe({ error: err => console.error('Failed to soft-delete expense on API', err) });
    } else {
      console.log('Offline: Expense deleted locally, will sync later.');
    }
  }
}