import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './new-record-modal.component.html',
})
export class NewRecordModalComponent {
  @Input() type: 'ingreso' | 'egreso' = 'ingreso';
  @Input() boxId?: number;

  private modalCtrl = inject(ModalController);

  // form fields
  date: string = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  extraFields: boolean = false;
  quantity?: number | null = null;
  price?: number | null = null;
  total?: number | null = null;
  note: string | null = null;

  get header() {
    return this.type === 'ingreso' ? 'Agregar ingreso' : 'Agregar egreso';
  }

    changeQuantity() {
    if (this.quantity && this.price) {
      this.total = this.quantity * this.price;
    } else {
      this.total = null;
    }
  }

  changePrice() {
    if (this.quantity && this.price) {
      this.total = this.quantity * this.price;
    } else {
      this.total = null;
    }
  }

  toggleExtraFields() {
    // this.extraFields = !this.extraFields;
    if (!this.extraFields) {
      // reset quantity and price if extraFields is turned off
      this.quantity = null;
      this.price = null;
      this.total = null;
    }
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