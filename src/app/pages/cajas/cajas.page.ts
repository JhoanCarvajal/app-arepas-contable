import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { BoxesService } from '../../services/boxes.service';
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
    this.boxesService.addBox({
      name,
      icon: this.newIcon,
      total: this.newTotal ?? 0,
    });
    // reset form
    this.newName = '';
    this.newIcon = 'cube-outline';
    this.newTotal = null;
  }

  deleteBox(id: number) {
    if (!confirm('Eliminar esta caja?')) return;
    this.boxesService.removeBox(id);
  }
}