import { Component, inject, Input, signal, WritableSignal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import { FormsModule, NgForm } from '@angular/forms';
import {
  IonCheckbox,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
  IonItem,
  IonLabel,
  IonDatetime,
  IonContent,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton
} from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
  IonToolbar,
  IonTitle,
  IonInput,
    IonItem,
    IonLabel,
    IonDatetime,
    IonContent,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonButton
  ],
  templateUrl: './new-record-modal.component.html',
})
export class NewRecordModalComponent {
  @Input() type: 'ingreso' | 'egreso' = 'ingreso';
  @Input() boxId?: number;
  @Input() cantPriceFields: boolean = false; // New Input

  @ViewChild('newControlForm') newControlForm?: NgForm;

  private modalCtrl = inject(ModalController);

  // form fields -> usando Signals
  date: WritableSignal<string> = signal(new Date().toISOString().split('T')[0]); // yyyy-mm-dd
  quantity: WritableSignal<number | null> = signal(null);
  price: WritableSignal<number | null> = signal(null);
  total: WritableSignal<number | null> = signal(null);
  note: WritableSignal<string | null> = signal(null);

  get header() {
    return this.type === 'ingreso' ? 'Agregar ingreso' : 'Agregar egreso';
  }

  changeDate(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    this.date.set(raw ? String(raw) : new Date().toISOString().split('T')[0]);
  }

  changeQuantity(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.quantity.set(Number.isNaN(parsed) ? null : parsed);

    if (this.quantity() != null && this.price() != null) {
      this.total.set(Number(this.quantity()) * Number(this.price()));
    } else {
      this.total.set(null);
    }
  }

  changePrice(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.price.set(Number.isNaN(parsed) ? null : parsed);

    if (this.quantity() != null && this.price() != null) {
      this.total.set(Number(this.quantity()) * Number(this.price()));
    } else {
      this.total.set(null);
    }
  }

  changeTotal(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.total.set(Number.isNaN(parsed) ? null : parsed);
  }

  changeNote(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    this.note.set(raw ? String(raw) : null);
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    const qty = Number(this.quantity() ?? 0) || 0;
    const pr = Number(this.price() ?? 0) || 0;

    let computedTotal: number;
    if (this.total() !== null && this.total() !== undefined) {
      computedTotal = Number(this.total()) || 0;
    } else {
      computedTotal = qty * pr;
    }

    if (this.type === 'egreso') {
      computedTotal = -Math.abs(Number(computedTotal));
    }

    const control = {
      date: this.date(),
      quantity: qty,
      price: pr,
      total: computedTotal,
      note: this.note(),
      boxId: this.boxId,
    };

    this.modalCtrl.dismiss(control, 'confirm');
  }
}