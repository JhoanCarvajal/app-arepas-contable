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
  ToastController,
  AlertController // Import AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencilOutline, trashOutline } from 'ionicons/icons';
import { ExpensesService, Expense } from '../../services/expenses.service';
import { BoxesService } from '../../services/boxes.service';
import { ExpensesBoxesService } from '../../services/expenses-boxes.service'; // Import ExpensesBoxesService

@Component({
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
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
    // IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    // IonLabel,
    IonText,
    IonButton,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage implements OnInit { 
  private boxesService = inject(BoxesService);
  expensesService = inject(ExpensesService);
  private expensesBoxesService = inject(ExpensesBoxesService); // Inject ExpensesBoxesService
  private alertController = inject(AlertController); // Inject AlertController

  expenses = this.expensesService.expenses;

  constructor(
    private toastController: ToastController
  ) {
    addIcons({ pencilOutline, trashOutline });
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

  // This logic is now simplified as many fields were removed from Expense
  private buildControlFromExpense(expense: Expense, box: any) {
    // Fallback: save the netProfit as a movement in the box
    const total = expense.netProfit ?? 0;
    return { date: expense.date, origin: 'expense', total };
  }

  async deleteExpense(expense: Expense) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro que desea eliminar este gasto? Se eliminarán todos los registros de caja asociados.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            if (!expense.id) return;

            // 1. Soft delete associated ExpensesBoxes
            const relatedExpensesBoxes = this.expensesBoxesService.getExpensesBoxesForExpense(expense.id);
            for (const eb of relatedExpensesBoxes) {
              await this.expensesBoxesService.removeExpenseBox(eb.id!);
              // 2. Soft delete associated BoxControls
              if (eb.box && eb.boxControl) {
                await this.boxesService.removeControlFromBox(eb.box, eb.boxControl);
              }
            }
            // 3. Soft delete the Expense itself
            await this.expensesService.removeExpense(expense.id);

            const toast = await this.toastController.create({
              message: 'Gasto y registros asociados eliminados lógicamente.',
              duration: 1500,
            });
            await toast.present();

            console.log('Deleted expense and associated records:', expense.id);
            console.log('expenses', this.expenses());
            
          },
        },
      ],
    });

    await alert.present();
  }
}
