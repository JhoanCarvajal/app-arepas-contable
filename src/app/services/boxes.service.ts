import { Injectable, signal } from '@angular/core';

export interface BoxRecord {
  id: number;
  boxId: number;
  date: string;
  createdAt: string;
  origin: 'manual' | 'historial' | string;
  extraFields?: any;
  quantity?: number;
  price?: number;
  total?: number;
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
    return this.boxes(); // devuelve el array actual (usado en templates)
  }

  getById(id: number) {
    return this.boxes().find(b => b.id === id);
  }

  addBox(data: { name: string; icon?: string; total?: number }) {
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
    return box;
  }

  updateBox(updated: Box) {
    const idx = this.boxes().findIndex(b => b.id === updated.id);
    if (idx === -1) return;
    const copy = [...this.boxes()];
    copy[idx] = { ...updated };
    this.boxes.set(copy);
    this.saveToLocalStorage();
  }

  removeBox(id: number) {
    this.boxes.set(this.boxes().filter(b => b.id !== id));
    this.saveToLocalStorage();
  }

  addRecordToBox(boxId: number, record: Partial<BoxRecord>) {
    const box = this.getById(boxId);
    if (!box) return;
    const r: BoxRecord = {
      id: this.generateUniqueId(),
      boxId,
      date: record.date ?? new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      origin: (record.origin as any) ?? 'manual',
      extraFields: record.extraFields ?? null,
      quantity: record.quantity ?? 0,
      price: record.price ?? 0,
      total: record.total ?? ((record.quantity ?? 0) * (record.price ?? 0)),
    };
    box.records = [r, ...box.records];
    // optionally update total:
    box.total = (box.total ?? 0) + (r.total ?? 0);
    this.updateBox(box);
    return r;
  }
}