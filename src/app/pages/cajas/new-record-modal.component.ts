import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { IonCheckbox } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [IonicModule],
  templateUrl: './new-record-modal.component.html',
})
export class NewRecordModalComponent {
  @Input() type: 'ingreso' | 'egreso' = 'ingreso';
  @Input() boxId?: number;

  private modalCtrl = inject(ModalController);

  // form fields
  // date: string = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  date: string = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
  extraFields: boolean = false;
  quantity?: number | null = null;
  price?: number | null = null;
  total?: number | null = null;
  note: string | null = null;

  get header() {
    return this.type === 'ingreso' ? 'Agregar ingreso' : 'Agregar egreso';
  }

  changeDate(event: any) {
    // event puede venir de (ionChange) { detail: { value } } o de input nativo (target.value)
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    this.date = raw ? String(raw) : new Date().toISOString().split('T')[0];
  }

  changeQuantity(event: any) {
    // Normalizar valor desde ionInput o input nativo
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.quantity = Number.isNaN(parsed) ? null : parsed;

    // Solo calcular total si también hay precio válido
    if (this.quantity != null && this.price != null) {
      this.total = Number(this.quantity) * Number(this.price);
    } else {
      // si falta alguno de los dos, limpiar el total para evitar datos inconsistentes
      this.total = null;
    }
  }

  changePrice(event: any) {
    // event puede venir de (ionInput) { detail: { value } } o de input nativo (target.value)
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.price = Number.isNaN(parsed) ? null : parsed;

    if (this.quantity != null && this.price != null) {
      this.total = Number(this.quantity) * Number(this.price);
    } else {
      this.total = null;
    }
  }

  changeTotal(event: any) {
    // event puede venir de (ionChange) { detail: { value } } o de input nativo (target.value)
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    const parsed = parseFloat(raw);
    this.total = Number.isNaN(parsed) ? null : parsed;
  }

  toggleExtraFields() {
    this.extraFields = !this.extraFields;
    // detectar los cambios en el dom y actualizar los valores de quantity y price

    if (!this.extraFields) {
      // reset quantity and price if extraFields is turned off
      this.quantity = null;
      this.price = null;
      this.total = null;
    }
  }

  changeNote(event: any) {
    const raw = event?.detail?.value ?? event?.target?.value ?? event;
    this.note = raw ? String(raw) : null;
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    const qty = Number(this.quantity) || 0;
    const pr = Number(this.price) || 0;

    let computedTotal: number;
    if (this.total !== null && this.total !== undefined) {
      computedTotal = Number(this.total) || 0;
    } else {
      computedTotal = qty * pr;
    }

    // si es egreso, guardar como negativo (opcional según tu lógica)
    if (this.type === 'egreso') {
      computedTotal = -Math.abs(Number(computedTotal));
    }

    const record = {
      date: this.date,
      quantity: qty,
      price: pr,
      total: computedTotal,
      note: this.note,
      type: this.type,
      boxId: this.boxId,
      extraFields: this.extraFields,
    };

    this.modalCtrl.dismiss(record, 'confirm');
  }
}