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
  IonIcon,
  ActionSheetController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, walletOutline } from 'ionicons/icons';
import { ExpensesService, Expense } from '../../services/expenses.service';
import { BoxesService } from '../../services/boxes.service';

@Component({
  templateUrl: './expenses.page.html', // Updated templateUrl
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
export class ExpensesPage implements OnInit { // Renamed class
  private boxesService = inject(BoxesService);
  expensesService = inject(ExpensesService); // Use ExpensesService
  expenses = this.expensesService.expenses; // Use expenses signal

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private toastController: ToastController
  ) {
    addIcons({ cashOutline, walletOutline });
  }

  ngOnInit() {
    // Logic to assign IDs can be kept if still needed
    const updatedExpenses = this.expenses().map(item => {
      if (item.id === undefined) {
        return { ...item, id: Math.floor(Math.random() * 1_000_000_000) };
      }
      return item;
    });
    this.expensesService.expenses.set(updatedExpenses);
    this.expensesService['saveToLocalStorage']();
  }

  async openAddToBox(item: Expense) {
    const boxes = this.boxesService.getAll();
    if (!boxes || boxes.length === 0) {
      const toast = await this.toastController.create({
        message: 'No hay cajas. Crea una primero!',
        duration: 1500,
      });
      await toast.present();
      return;
    }

    const buttons = boxes.map(b => ({
      text: b.name,
      role: 'selected',
      handler: async () => {
        const control = this.buildControlFromExpense(item, b);
        this.boxesService.addControlToBox(b.id, control);
        const toast = await this.toastController.create({
          message: `Agregado a ${b.name}`,
          duration: 1500,
        });
        await toast.present();
      }
    }));

    buttons.push({
      text: 'Cancelar',
      role: 'cancel',
      handler: () => Promise.resolve()
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Selecciona una caja',
      buttons: buttons,
    });

    await actionSheet.present();
  }

  // This logic is now simplified as many fields were removed from Expense
  private buildControlFromExpense(expense: Expense, box: any) {
    // Fallback: save the netProfit as a movement in the box
    const total = expense.netProfit ?? 0;
    return { date: expense.date, origin: 'expense', total };
  }
}