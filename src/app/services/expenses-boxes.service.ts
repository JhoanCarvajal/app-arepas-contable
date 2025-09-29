import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { ExpenseBox } from '../models/expense-box.model';

@Injectable({
  providedIn: 'root',
})
export class ExpensesBoxesService {
  expensesBoxes = signal<ExpenseBox[]>([]);
  private storageKey = 'registro-ganancias-expensesboxes';
  private apiService = inject(ApiService);

  constructor() {
    this.loadFromLocalStorage();
  }

  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.expensesBoxes().some(eb => eb.id === id));
    return id;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.expensesBoxes()));
    } catch (e) {
      console.error('Error guardando expensesBoxes en localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExpenseBox[];
      this.expensesBoxes.set(parsed);
    } catch (e) {
      console.error('Error leyendo expensesBoxes desde localStorage', e);
    }
  }

  getAll() {
    return this.expensesBoxes();
  }

  getById(id: number) {
    return this.expensesBoxes().find(eb => eb.id === id);
  }

  getExpensesBoxesForExpense(expenseId: number): ExpenseBox[] {
    return this.expensesBoxes().filter(eb => eb.expense === expenseId);
  }

  addExpensesBoxes(newExpensesBoxes: ExpenseBox[]) {
    const currentExpensesBoxes = this.expensesBoxes();
    this.expensesBoxes.set([...currentExpensesBoxes, ...newExpensesBoxes]);
    this.saveToLocalStorage();
  }

  async addExpenseBox(expenseBox: Partial<ExpenseBox>) {
    const newExpenseBox: ExpenseBox = {
      ...expenseBox,
      id: this.generateUniqueId(),
    } as ExpenseBox;
    const updated = [newExpenseBox, ...this.expensesBoxes()];
    this.expensesBoxes.set(updated);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.createExpenseBox(newExpenseBox).pipe(
        tap(apiExpenseBox => console.log('ExpenseBox created on API:', apiExpenseBox))
      ).subscribe({ error: err => console.error('Failed to create ExpenseBox on API', err) });
    } else {
      console.log('Offline: ExpenseBox saved locally, will sync later.');
    }
    return newExpenseBox;
  }

  async updateExpenseBox(updated: ExpenseBox) {
    const idx = this.expensesBoxes().findIndex(eb => (updated.id !== undefined && eb.id === updated.id));
    if (idx === -1) return;
    const copy = [...this.expensesBoxes()];
    copy[idx] = { ...updated };
    this.expensesBoxes.set(copy);
    this.saveToLocalStorage();

    if (updated.id && await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.updateExpenseBox(updated.id, updated).pipe(
        tap(apiExpenseBox => console.log('ExpenseBox updated on API:', apiExpenseBox))
      ).subscribe({ error: err => console.error('Failed to update ExpenseBox on API', err) });
    } else {
      console.log('Offline: ExpenseBox updated locally, will sync later.');
    }
  }

  async removeExpenseBox(id: number) {
    this.expensesBoxes.update(expensesBoxes => expensesBoxes.filter(eb => eb.id !== id));
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.deleteExpenseBox(id).pipe(
        tap(() => console.log('ExpenseBox soft-deleted on API:', id))
      ).subscribe({ error: err => console.error('Failed to soft-delete ExpenseBox on API', err) });
    } else {
      console.log('Offline: ExpenseBox deleted locally, will sync later.');
    }
  }
}
