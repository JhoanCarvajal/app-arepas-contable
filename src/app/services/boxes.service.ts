import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
import { ExpensesBoxesService } from './expenses-boxes.service'; // Import ExpensesBoxesService

export interface BoxControl {
  id: number;
  boxId: number;
  date: string;
  origin: string;
  quantity?: number | null;
  price?: number | null;
  total: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Box {
  id: number;
  icon: string;
  name: string;
  total: number;
  cantPriceFields: boolean;
  createdAt: string;
  controls: BoxControl[];
  deletedAt?: string | null; // Add deletedAt for Box soft delete
}

@Injectable({
  providedIn: 'root',
})
export class BoxesService {
  private storageKey = 'registro-ganancias-boxes';
  boxes = signal<Box[]>([]);
  private apiService = inject(ApiService);
  private expensesBoxesService = inject(ExpensesBoxesService); // Inject ExpensesBoxesService

  constructor() {
    this.loadFromLocalStorage();
  }

  private generateUniqueId(): number {
    let id: number;
    do {
      id = Math.floor(Math.random() * 1_000_000_000);
    } while (this.boxes().some(b => b.id === id));
    return id;
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.boxes()));
    } catch (e) {
      console.error('Error guardando cajas en localStorage', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Box[];
      this.boxes.set(parsed.filter(b => !b.deletedAt));
    } catch (e) {
      console.error('Error leyendo cajas desde localStorage', e);
    }
  }

  getAll() {
    return this.boxes();
  }

  getById(id: number) {
    return this.boxes().find(b => b.id === id);
  }

  // New method to get a specific BoxControl by its ID
  getControlById(controlId: number): BoxControl | undefined {
    for (const box of this.boxes()) {
      const control = box.controls.find(c => c.id === controlId);
      if (control) {
        return control;
      }
    }
    return undefined;
  }

  addBoxes(newBoxes: Box[]) {
    const currentBoxes = this.boxes();
    this.boxes.set([...currentBoxes, ...newBoxes]);
    this.saveToLocalStorage();
  }

  async addBox(data: { name: string; icon?: string; total?: number, cantPriceFields?: boolean }) {
    const box: Box = {
      id: this.generateUniqueId(),
      icon: data.icon ?? 'cube-outline',
      name: data.name ?? 'Caja',
      total: data.total ?? 0,
      cantPriceFields: data.cantPriceFields ?? false,
      createdAt: new Date().toISOString(),
      controls: [],
    };
    this.boxes.set([box, ...this.boxes()]);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.createBox(box).pipe(
        tap(apiBox => console.log('Box created on API:', apiBox))
      ).subscribe({ error: err => console.error('Failed to create box on API', err) });
    } else {
      console.log('Offline: Box saved locally, will sync later.');
    }

    return box;
  }

  async updateBox(updated: Box) {
    const idx = this.boxes().findIndex(b => b.id === updated.id);
    if (idx === -1) return;
    const copy = [...this.boxes()];
    copy[idx] = { ...updated };
    this.boxes.set(copy);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.updateBox(updated.id, updated).pipe(
        tap(apiBox => console.log('Box updated on API:', apiBox))
      ).subscribe({ error: err => console.error('Failed to update box on API', err) });
    } else {
      console.log('Offline: Box updated locally, will sync later.');
    }
  }

  // New method to update a specific BoxControl
  async updateControl(boxId: number, updatedControl: BoxControl) {
    const box = this.getById(boxId);
    if (!box) return;

    const controlIdx = box.controls.findIndex(c => c.id === updatedControl.id);
    if (controlIdx === -1) return;

    box.controls[controlIdx] = { ...updatedControl };
    // box.total = (box.total ?? 0) + (updatedControl.total ?? 0);
    box.total = box.controls.reduce((sum, ctrl) => sum + (ctrl.total ?? 0), 0);
    this.updateBox(box); // This will also save to local storage and attempt API update for the box

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.updateBoxControl(updatedControl.id, updatedControl).pipe(
        tap(apiControl => console.log('BoxControl updated on API:', apiControl))
      ).subscribe({ error: err => console.error('Failed to update BoxControl on API', err) });
    } else {
      console.log('Offline: BoxControl updated locally, will sync later.');
    }
  }

  async removeBox(id: number) {
    this.boxes.update(boxes => boxes.filter(b => b.id !== id));
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.deleteBox(id).pipe(
        tap(() => console.log('Box soft-deleted on API:', id))
      ).subscribe({ error: err => console.error('Failed to soft-delete box on API', err) });
    } else {
      console.log('Offline: Box deleted locally, will sync later.');
    }
  }

  async addControlToBox(boxId: number, control: Partial<BoxControl>) {
    const box = this.getById(boxId);
    if (!box) return;
    const newControl: BoxControl = {
      id: this.generateUniqueId(),
      boxId,
      date: control.date ?? new Date().toISOString().split('T')[0],
      origin: (control.origin as any) ?? 'manual',
      quantity: control.quantity ?? 0,
      price: control.price ?? 0,
      total: control.total ?? ((control.quantity ?? 0) * (control.price ?? 0)),
      note: control.note ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    box.controls = [newControl, ...box.controls];
    box.total = (box.total ?? 0) + (newControl.total ?? 0);
    this.updateBox(box);

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.createBoxControl(newControl).pipe(
        tap(apiControl => console.log('BoxControl created on API:', apiControl))
      ).subscribe({ error: err => console.error('Failed to create BoxControl on API', err) });
    } else {
      console.log('Offline: BoxControl saved locally, will sync later.');
    }

    return newControl;
  }

  addControlToBoxLocal(boxId: number, control: BoxControl) {
    const box = this.getById(boxId);
    if (!box || box.controls.find(c => c.id === control.id)) {
      return;
    }
    box.controls.push(control);
    box.controls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const idx = this.boxes().findIndex(b => b.id === boxId);
    if (idx === -1) return;
    const copy = [...this.boxes()];
    copy[idx] = box;
    this.boxes.set(copy);
    this.saveToLocalStorage();
  }

  async removeControlFromBox(boxId: number, controlId: number) {
    const box = this.getById(boxId);
    if (!box) return;

    const control = box.controls.find(c => c.id === controlId);
    if (!control) return;

    // New logic: Check for and delete related ExpensesBoxes entry first
    const allExpensesBoxes = this.expensesBoxesService.getAll();
    const relatedExpenseBox = allExpensesBoxes.find(eb => eb.boxControl === controlId);
    if (relatedExpenseBox && relatedExpenseBox.id) {
      await this.expensesBoxesService.removeExpenseBox(relatedExpenseBox.id);
    }

    // Proceed with deleting the BoxControl
    box.total = (box.total ?? 0) - (control.total ?? 0);
    box.controls = box.controls.filter(c => c.id !== controlId);
    this.updateBox(box);

    if (await this.apiService.isOnlineAndApiAvailable()) {
      this.apiService.deleteBoxControl(controlId).pipe(
        tap(() => console.log('BoxControl soft-deleted on API:', controlId))
      ).subscribe({ error: err => console.error('Failed to soft-delete BoxControl on API', err) });
    } else {
      console.log('Offline: BoxControl deleted locally, will sync later.');
    }
  }
}
