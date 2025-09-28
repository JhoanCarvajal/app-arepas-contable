import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BoxesService, BoxControl } from '../../services/boxes.service'; // Import BoxControl
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cubeOutline, trashOutline } from 'ionicons/icons';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, FormsModule],
  templateUrl: 'cajas.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajasPage {
  private boxesService = inject(BoxesService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  // campos del formulario simple
  newName = '';
  newIcon = 'cube-outline';
  newTotal: number | null = null;
  cantPriceFields = false; // Add this property

  constructor() {
    addIcons({ cubeOutline, trashOutline });
  }

  // getter para usar en template
  get boxes() {
    return this.boxesService.getAll();
  }

  async createBox() {
    const name = (this.newName || '').trim();
    if (!name) return;

    const createdBox = await this.boxesService.addBox({
      name,
      icon: this.newIcon,
      total: 0,
      cantPriceFields: this.cantPriceFields,
    });

    if (this.newTotal && !isNaN(this.newTotal) && this.newTotal > 0) {
        const newControl: Partial<BoxControl> = {
            origin: 'base',
            total: this.newTotal,
            note: 'Ingreso inicial',
        };
        await this.boxesService.addControlToBox(createdBox.id, newControl);
    }

    // reset form
    this.newName = '';
    this.newIcon = 'cube-outline';
    this.newTotal = null;
    this.cantPriceFields = false;
  }

  async deleteBox(event: any, id: number) {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro que desea eliminar esta caja? Se eliminarán TODOS los registros asociados a ella.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.boxesService.removeBox(id);
          },
        },
      ],
    });

    await alert.present();
  }

  goToBoxDetail(id: number) {
    this.router.navigate(['/tabs/cajas', id]);
  }
}
