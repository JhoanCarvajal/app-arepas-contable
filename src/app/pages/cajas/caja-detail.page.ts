import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { BoxesService, Box, BoxRecord } from '../../services/boxes.service';
import { computed, effect } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './caja-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaDetailPage implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private boxesService = inject(BoxesService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

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

  async openAddRecord(type: 'ingreso' | 'egreso') {
    const header = type === 'ingreso' ? 'Agregar ingreso' : 'Agregar egreso';
    const defaultDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd for date input

    const alert = await this.alertCtrl.create({
      header,
      inputs: [
        { name: 'date', type: 'date', value: defaultDate, label: 'Fecha' },
        { name: 'quantity', type: 'number', placeholder: 'Cantidad (opcional)' },
        { name: 'price', type: 'number', placeholder: 'Precio unitario (opcional)' },
        { name: 'total', type: 'number', placeholder: 'Total (si lo especificas se usará)' },
        { name: 'note', type: 'text', placeholder: 'Nota (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data: any) => {
            const qty = Number(data.quantity) || 0;
            const price = Number(data.price) || 0;
            let total = data.total !== undefined && data.total !== '' ? Number(data.total) : (qty * price);
            if (isNaN(total)) total = 0;
            if (type === 'egreso') total = -Math.abs(total); // egreso como valor negativo para restar del total

            const recordPartial = {
              date: data.date ? new Date(data.date).toLocaleDateString() : new Date().toLocaleDateString(),
              origin: 'manual',
              quantity: qty || undefined,
              price: price || undefined,
              total,
              extraFields: { note: data.note ?? null },
            };

            this.boxesService.addRecordToBox(this.boxId, recordPartial);

            this.toastCtrl.create({ message: `${header} agregada`, duration: 1400 }).then(t => t.present());
          },
        },
      ],
    });

    await alert.present();
  }
}