import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { BoxesService, BoxRecord } from '../../services/boxes.service';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cubeOutline, trashOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
  templateUrl: 'cajas.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajasPage {
  private boxesService = inject(BoxesService);

  // campos del formulario simple
  newName = '';
  newIcon = 'cube-outline';
  newTotal: number | null = null;

  constructor() {
    addIcons({ cubeOutline, trashOutline });
  }

  // getter para usar en template
  get boxes() {
    return this.boxesService.getAll();
  }

  createBox() {
    const name = (this.newName || '').trim();
    if (!name) return;

    // crear la caja en cero
    const createdBox =this.boxesService.addBox({
      name,
      icon: this.newIcon,
      total: 0,
    });

    // agregar un registro inicial si aplica
    // si el total es un numero valido, despues de crear la caja, crear un ingreso inicial
    if (this.newTotal && !isNaN(this.newTotal) && this.newTotal > 0) {
        const newRecord: Partial<BoxRecord> = {
            origin: 'base',
            total: this.newTotal,
            note: 'Ingreso inicial',
        };
        this.boxesService.addRecordToBox(createdBox.id, newRecord);
    }

    // reset form
    this.newName = '';
    this.newIcon = 'cube-outline';
    this.newTotal = null;
  }

  deleteBox(event: any,id: number) {
    event.stopPropagation();
    if (!confirm('Eliminar esta caja?')) return;
    this.boxesService.removeBox(id);
  }
}