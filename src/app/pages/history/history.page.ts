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
import { FinanceService } from '../../services/finance.service';

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
}
