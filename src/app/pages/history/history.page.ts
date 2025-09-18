import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, walletOutline } from 'ionicons/icons';
import { FinanceService, Submission } from '../../services/finance.service';
import { BoxesService } from '../../services/boxes.service';
import { ActionSheetController, ToastController } from '@ionic/angular';

@Component({
  templateUrl: './history.page.html',
  imports: [
    CommonModule,
    RouterLink,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonText,
    IonButton,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryPage implements OnInit {
  private boxesService = inject(BoxesService);
  private actionSheetCtrl = inject(ActionSheetController);
  private toastCtrl = inject(ToastController);
  private finance = inject(FinanceService);

  financeService = inject(FinanceService);
  history = this.financeService.history;

  constructor() {
    addIcons({ cashOutline, walletOutline });
  }

  ngOnInit() {
    // verificar hay algun registro sin id y asignarselo
    const updatedHistory = this.history().map(item => {
      if (item.id === undefined) {
        return { ...item, id: Math.floor(Math.random() * 1_000_000_000) };
      }
      return item;
    });
    this.financeService.history.set(updatedHistory);
    console.log('Registros actualizados con id donde faltaba:', updatedHistory);
    this.financeService['saveToLocalStorage'](); // guardar cambios
  }

  async openAddToBox(item: Submission) {
    const boxes = this.boxesService.getAll();
    if (!boxes || boxes.length === 0) {
      const t = await this.toastCtrl.create({ message: 'No hay cajas. Crea una primero.', duration: 2000 });
      await t.present();
      return;
    }

    const buttons = boxes.map(b => ({
      text: b.name,
      handler: () => {
        const record = this.buildRecordFromSubmission(item, b);
        this.boxesService.addRecordToBox(b.id, record);
        this.toastCtrl.create({ message: `Agregado a ${b.name}`, duration: 1500 }).then(t => t.present());
      },
    }));

    buttons.push({ text: 'Cancelar', handler: () => {}});

    const as = await this.actionSheetCtrl.create({ header: 'Selecciona caja', buttons });
    await as.present();
  }

  // mapea Submission a Partial<BoxRecord> de forma razonable
  private buildRecordFromSubmission(s: Submission, box: any) {
    // heurística: si el nombre de la caja contiene keywords, sacamos el total del campo correspondiente
    const name = (box.name || '').toLowerCase();
    let total = 0;
    if (name.includes('maíz') || name.includes('maiz')) {
      total = (s.cornBags ?? 0) * (s.cornPrice ?? 0);
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', quantity: s.cornBags ?? 0, price: s.cornPrice ?? 0, total };
    }
    if (name.includes('carbón') || name.includes('carbon')) {
      total = (s.charcoalBags ?? 0) * (s.charcoalPrice ?? 0);
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', quantity: s.charcoalBags ?? 0, price: s.charcoalPrice ?? 0, total };
    }
    if (name.includes('general')) {
      total = s.generalExpenses ?? 0;
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
    }
    if (name.includes('operacion') || name.includes('operac')) {
      total = s.operatingExpenses ?? 0;
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
    }
    if (name.includes('trabajador')) {
      total = s.workerExpenses ?? 0;
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
    }
    if (name.includes('arriendo')) {
      total = s.rentExpenses ?? 0;
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
    }
    if (name.includes('moto') || name.includes('motos')) {
      total = s.motorcycleExpenses ?? 0;
      return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
    }

    // fallback: guardar el netProfit como movimiento
    total = s.netProfit ?? 0;
    return { date: s.date ?? new Date().toLocaleDateString(), origin: 'historial', total };
  }
}
