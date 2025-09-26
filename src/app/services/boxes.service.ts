import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';
// Removed: import { SyncService } from './sync.service'; // Import SyncService

export interface BoxRecord {
  id: number;
  boxId: number;
  date: string;
  createdAt: string;
  origin: 'manual' | 'historial' | string;
  extraFields?: boolean;
  quantity?: number;
  price?: number;
  total?: number;
  note?: string | null;
}

export interface Box {
  id: number;
  icon: string;
  name: string;
  total: number;
  createdAt: string;
  records: BoxRecord[];
}

@Injectable({
  providedIn: 'root',
})
export class BoxesService {
  private storageKey = 'registro-ganancias-boxes';
  boxes = signal<Box[]>([]);
  private apiService = inject(ApiService);
  // Removed: private syncService = inject(SyncService); // Inject SyncService

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
      this.boxes.set(parsed);
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

  addBoxes(newBoxes: Box[]) {
    const currentBoxes = this.boxes();
    this.boxes.set([...currentBoxes, ...newBoxes]);
    this.saveToLocalStorage();
  }

  async addBox(data: { name: string; icon?: string; total?: number }) { // Make async
    const box: Box = {
      id: this.generateUniqueId(),
      icon: data.icon ?? 'cube-outline',
      name: data.name ?? 'Caja',
      total: data.total ?? 0,
      createdAt: new Date().toISOString(),
      records: [],
    };
    this.boxes.set([box, ...this.boxes()]);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.createBox(box).pipe(
        tap(apiBox => console.log('Box created on API:', apiBox))
      ).subscribe({ error: err => console.error('Failed to create box on API', err) });
    } else {
      console.log('Offline: Box saved locally, will sync later.');
    }

    return box;
  }

  async updateBox(updated: Box) { // Make async
    const idx = this.boxes().findIndex(b => b.id === updated.id);
    if (idx === -1) return;
    const copy = [...this.boxes()];
    copy[idx] = { ...updated };
    this.boxes.set(copy);
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.updateBox(updated.id, updated).pipe(
        tap(apiBox => console.log('Box updated on API:', apiBox))
      ).subscribe({ error: err => console.error('Failed to update box on API', err) });
    } else {
      console.log('Offline: Box updated locally, will sync later.');
    }
  }

  async removeBox(id: number) { // Make async
    this.boxes.set(this.boxes().filter(b => b.id !== id));
    this.saveToLocalStorage();

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.deleteBox(id).pipe(
        tap(() => console.log('Box deleted on API:', id))
      ).subscribe({ error: err => console.error('Failed to delete box on API', err) });
    } else {
      console.log('Offline: Box deleted locally, will sync later.');
    }
  }

  async addRecordToBox(boxId: number, record: Partial<BoxRecord>) { // Make async
    const box = this.getById(boxId);
    if (!box) return;
    const newRecord: BoxRecord = {
      id: this.generateUniqueId(),
      boxId,
      date: record.date ?? new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      origin: (record.origin as any) ?? 'manual',
      extraFields: record.extraFields ?? false,
      quantity: record.quantity ?? 0,
      price: record.price ?? 0,
      total: record.total ?? ((record.quantity ?? 0) * (record.price ?? 0)),
      note: record.note ?? null,
    };
    box.records = [newRecord, ...box.records];
    box.total = (box.total ?? 0) + (newRecord.total ?? 0);
    this.updateBox(box); // This calls updateBox, which is now async and conditional

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.createRecord(newRecord).pipe(
        tap(apiRecord => console.log('Record created on API:', apiRecord))
      ).subscribe({ error: err => console.error('Failed to create record on API', err) });
    } else {
      console.log('Offline: Record saved locally, will sync later.');
    }

    return newRecord;
  }

  addRecordToBoxLocal(boxId: number, record: BoxRecord) {
    const box = this.getById(boxId);
    if (!box || box.records.find(r => r.id === record.id)) {
      return;
    }
    box.records.push(record);
    box.records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const idx = this.boxes().findIndex(b => b.id === boxId);
    if (idx === -1) return;
    const copy = [...this.boxes()];
    copy[idx] = box;
    this.boxes.set(copy);
    this.saveToLocalStorage();
  }

  async removeRecordFromBox(boxId: number, recordId: number) { // Make async
    const box = this.getById(boxId);
    if (!box) return;

    const record = box.records.find(r => r.id === recordId);
    if (!record) return;

    box.total = (box.total ?? 0) - (record.total ?? 0);
    box.records = box.records.filter(r => r.id !== recordId);
    this.updateBox(box); // This calls updateBox, which is now async and conditional

    if (await this.apiService.isOnlineAndApiAvailable()) { // Conditional API call
      this.apiService.deleteRecord(recordId).pipe(
        tap(() => console.log('Record deleted on API:', recordId))
      ).subscribe({ error: err => console.error('Failed to delete record on API', err) });
    } else {
      console.log('Offline: Record deleted locally, will sync later.');
    }
  }
}
