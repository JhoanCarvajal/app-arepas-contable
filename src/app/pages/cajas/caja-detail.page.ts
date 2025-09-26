import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { BoxesService, Box, BoxRecord } from '../../services/boxes.service';
import { computed, effect } from '@angular/core';
import { ToastController, AlertController, ModalController } from '@ionic/angular/standalone';
import { NewRecordModalComponent } from './new-record-modal.component';

@Component({
  standalone: true,
  imports: [DecimalPipe, IonicModule, RouterModule],
  templateUrl: './caja-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaDetailPage implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private boxesService = inject(BoxesService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

  message = '';

  // obtener id desde params (ruta /tabs/cajas/:id)
  boxId = Number(this.route.snapshot.paramMap.get('id'));

  // caja reactiva
  box = computed<Box | undefined>(() => this.boxesService.getById(this.boxId));

  // records de la caja (ordenados por createdAt asc)
  series = computed(() => {
    const b = this.box();
    if (!b) return [] as BoxRecord[];
    return [...b.records].sort((a, z) => new Date(a.createdAt).getTime() - new Date(z.createdAt).getTime());
  });

  ngAfterViewInit(): void {
    console.log(this.route.snapshot.paramMap.get('id'))
    // si no existe la caja, redirigir a /tabs/cajas
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
    // efecto reactivo: reconstruir cuando cambien los records
    // effect(() => {
    //   // leer series para registrar dependencia
    //   this.series();
    //   build();
    // });
  }

  // helpers para template
  getBoxName() {
    return this.box()?.name ?? 'Caja';
  }

  getTotal() {
    return this.box()?.total ?? 0;
  }

  // eliminar record
  removeRecord(recordId: number) {
    const b = this.box();
    if (!b) return;
    b.records = b.records.filter(r => r.id !== recordId);
    // recalcular total opcional (sum records)
    b.total = b.records.reduce((acc, r) => acc + (r.total ?? 0), 0);
    this.boxesService.updateBox(b);
  }

  async openModal() {
    const modal = await this.modalCtrl.create({
      component: NewRecordModalComponent,
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.message = `Hello, ${data}!`;
    }
  }

  // reemplaza / usa en lugar de la versión anterior
  async openAddRecord(type: 'ingreso' | 'egreso') {
    const modal = await this.modalCtrl.create({
      component: NewRecordModalComponent,
      componentProps: {
        type,
        boxId: this.boxId,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) return;

    // el modal puede devolver el record directamente o dentro de { record }
    const record = (data && (data.record ?? data)) as Partial<BoxRecord>;
    if (!record) return;

    this.boxesService.addRecordToBox(this.boxId, record);

    // await Toast.show({ text: `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} agregado`, duration: 'short' });
    this.toastCtrl.create({ message: `${type === 'ingreso' ? 'Ingreso' : 'Egreso'} agregado`, duration: 1400 }).then(t => t.present());
  }

}