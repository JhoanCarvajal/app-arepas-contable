import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { BoxesService, Box, BoxRecord } from '../../services/boxes.service';
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
  private alertCtrl = inject(AlertController); // Already injected
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
    if (!b) return [] as BoxRecord[];
    return [...b.records].sort((a, z) => new Date(a.createdAt).getTime() - new Date(z.createdAt).getTime());
  });

  ionViewWillEnter() {
    this.syncService.syncBoxRecords(this.boxId);
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

  async removeRecord(recordId: number) { // Make async
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
            this.boxesService.removeRecordFromBox(this.boxId, recordId);
          },
        },
      ],
    });

    await alert.present();
  }

  async openAddRecord(type: 'ingreso' | 'egreso') {
    const modal = await this.modalCtrl.create({
      component: NewRecordModalComponent,
      componentProps: {
        type,
        boxId: this.boxId,
      },
      cssClass: 'ac-modal',
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) return;

    const record = (data && (data.record ?? data)) as Partial<BoxRecord>;
    if (!record) return;

    this.boxesService.addRecordToBox(this.boxId, record);

    this.toastCtrl.create({ message: `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} agregado`, duration: 1400 }).then(t => t.present());
  }

}