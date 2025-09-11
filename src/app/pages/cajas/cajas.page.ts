import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonList, IonItem, IonLabel, IonIcon, IonText,
  IonContent,
  IonTitle,
  IonToolbar,
  IonHeader, } from '@ionic/angular/standalone';
import { FinanceService } from '../../services/finance.service';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { cubeOutline, sparklesOutline, peopleOutline, businessOutline, bicycleOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [CommonModule, IonList, IonItem, IonLabel, IonIcon, IonText, IonContent, IonTitle, IonToolbar, IonHeader, RouterModule],
  templateUrl: 'cajas.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CajasPage {
  private finance = inject(FinanceService);

  // definición de cajas con clave y etiqueta e icono
  boxes = [
    { key: 'maiz', label: 'Caja de Maíz', icon: 'cube-outline' },
    { key: 'carbon', label: 'Caja de Carbón', icon: 'sparkles-outline' },
    // { key: 'general', label: 'Caja General', icon: 'layers-outline' },
    // { key: 'operaciones', label: 'Caja de Operaciones', icon: 'construct-outline' },
    { key: 'trabajadores', label: 'Caja de Trabajadores', icon: 'people-outline' },
    { key: 'arriendo', label: 'Caja de Arriendo', icon: 'business-outline' },
    { key: 'motos', label: 'Caja de Motos', icon: 'bicycle-outline' },
  ];

  constructor() {
    addIcons({ cubeOutline, sparklesOutline, peopleOutline, businessOutline, bicycleOutline });
  }

  // calculamos el total por caja leyendo todos los registros en history()
  totalFor = (key: string) =>
    computed(() => {
      const items = this.finance.history();
      return items.reduce((acc, s) => {
        switch (key) {
          case 'maiz':
            return acc + ((s.cornBags ?? 0) * (s.cornPrice ?? 0));
          case 'carbon':
            return acc + ((s.charcoalBags ?? 0) * (s.charcoalPrice ?? 0));
        //   case 'general':
        //     return acc + (s.generalExpenses ?? 0);
        //   case 'operaciones':
        //     return acc + (s.operatingExpenses ?? 0);
          case 'trabajadores':
            return acc + (s.workerExpenses ?? 0);
          case 'arriendo':
            return acc + (s.rentExpenses ?? 0);
          case 'motos':
            return acc + (s.motorcycleExpenses ?? 0);
          default:
            return acc;
        }
      }, 0);
    });
}