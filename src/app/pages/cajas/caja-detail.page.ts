import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { BoxesService, Box, BoxControl } from '../../services/boxes.service'; // Import BoxControl
import { computed, effect } from '@angular/core';
import {
  ToastController,
  AlertController,
  ModalController,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { NewRecordModalComponent } from './new-record-modal.component';
import { SyncService } from '../../services/sync.service';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [
    DecimalPipe,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
  ],
  templateUrl: './caja-detail.page.html',
  styleUrls: ['./caja-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaDetailPage implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private boxesService = inject(BoxesService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private syncService = inject(SyncService);

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

  message = '';

  boxId = Number(this.route.snapshot.paramMap.get('id'));
  box = computed<Box | undefined>(() => this.boxesService.getById(this.boxId));
  series = computed(() => {
    const b = this.box();
    if (!b) return [] as BoxControl[];
    return [...b.controls].sort((a, z) => new Date(a.createdAt).getTime() - new Date(z.createdAt).getTime());
  });

  constructor() {
    addIcons({ trashOutline });
  }

  ionViewWillEnter() {
    this.syncService.syncBoxControls(this.boxId);
  }

  ngAfterViewInit(): void {
    if (!this.box()) {
      window.alert(`Caja no encontrada ${this.boxId}`);
      window.location.href = '/tabs/cajas';
    }

    const build = () => {
      const items = this.series();
      const labels = items.map(i => i.date);
      const data = items.map(i => i.total ?? 0);

      if (!this.chartCanvas) return;
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets = [{ label: this.box()?.name ?? 'Movimientos', data, fill: false, borderColor: '#3b82f6', backgroundColor: '#3b82f6', tension: 0.2 }];
        this.chart.update();
        return;
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: this.box()?.name ?? 'Movimientos',
            data,
            fill: false,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            tension: 0.2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { display: true }, y: { display: true, beginAtZero: true } },
        },
      });
    };

    build();
  }

  getBoxName() {
    return this.box()?.name ?? 'Caja';
  }

  getTotal() {
    return this.box()?.total ?? 0;
  }

  async removeControl(controlId: number) { // Renamed from removeRecord
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro que desea eliminar este registro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.boxesService.removeControlFromBox(this.boxId, controlId); // Use removeControlFromBox
          },
        },
      ],
    });

    await alert.present();
  }

  async openAddControl(type: 'ingreso' | 'egreso') { // Renamed from openAddRecord
    const modal = await this.modalCtrl.create({
      component: NewRecordModalComponent,
      componentProps: {
        type,
        boxId: this.boxId,
        cantPriceFields: this.box()?.cantPriceFields ?? false,
      },
      cssClass: 'ac-modal',
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) return;

    const control = (data && (data.record ?? data)) as Partial<BoxControl>; // Use BoxControl
    if (!control) return;

    this.boxesService.addControlToBox(this.boxId, control); // Use addControlToBox

    this.toastCtrl.create({ message: `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} agregado`, duration: 1400 }).then(t => t.present());
  }
}
