import { Component, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonText, IonButtons, IonBackButton } from '@ionic/angular/standalone';

import { ActivatedRoute } from '@angular/router';
import { FinanceService, Submission } from '../../services/finance.service';
import { computed, effect } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonText, IonButtons, IonBackButton],
  templateUrl: 'caja-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajaDetailPage implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private finance = inject(FinanceService);

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  chart?: Chart;

  // key de la caja (maiz, carbon, operaciones, etc.)
  key = this.route.snapshot.paramMap.get('key') || '';

  // serie computada: array de {label, value, createdAt}
  serie = computed(() => {
    const items = this.finance.history()
      .map((s: Submission) => {
        let value = 0;
        switch (this.key) {
          case 'maiz':
            value = (s.cornBags ?? 0) * (s.cornPrice ?? 0);
            break;
          case 'carbon':
            value = (s.charcoalBags ?? 0) * (s.charcoalPrice ?? 0);
            break;
          case 'general':
            value = s.generalExpenses ?? 0;
            break;
          case 'operaciones':
            value = s.operatingExpenses ?? 0;
            break;
          case 'trabajadores':
            value = s.workerExpenses ?? 0;
            break;
          case 'arriendo':
            value = s.rentExpenses ?? 0;
            break;
          case 'motos':
            value = s.motorcycleExpenses ?? 0;
            break;
          default:
            value = 0;
        }
        return { createdAt: s.createdAt, dateLabel: s.date ?? new Date(s.createdAt).toLocaleDateString(), value };
      })
      .filter(x => x.value !== 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return items;
  });

  ngAfterViewInit(): void {
    // Crear chart al montar y re-actualizar cuando cambien los datos
    const build = () => {
      const items = this.serie();
      const labels = items.map(i => i.dateLabel);
      const data = items.map(i => i.value);

      if (!this.chartCanvas) return;
      const ctx = this.chartCanvas.nativeElement.getContext('2d');
      if (!ctx) return;

      if (this.chart) {
        // actualizar dataset
        this.chart.data.labels = labels;
        this.chart.data.datasets = [{
          label: this.getLabel(),
          data,
          fill: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.2,
        }];
        this.chart.update();
        return;
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: this.getLabel(),
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
          scales: {
            x: { display: true },
            y: { display: true, beginAtZero: true },
          },
        },
      });
    };

    build();

    // efecto reactivo: rebuild cada vez que cambie history()
    // effect(() => {
    //   // acceder a serie() dentro del effect para que se registre la dependencia
    //   this.serie();
    //   build();
    // });
  }

  getLabel() {
    // etiqueta bonita para la gráfica
    const box = this.key.charAt(0).toUpperCase() + this.key.slice(1);
    return `Movimiento - ${box}`;
  }
}