import { Component, signal, ChangeDetectionStrategy, computed, WritableSignal, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonListHeader,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  ActionSheetController,
  IonButtons, IonIcon, IonRow, IonGrid, IonCol } from '@ionic/angular/standalone';
import { ExpensesService, Expense } from '../../services/expenses.service';
import { BoxesService, Box, BoxControl } from '../../services/boxes.service';
import { ApiService } from '../../services/api.service';
import { ExpensesBoxesService } from '../../services/expenses-boxes.service'; // Added ExpensesBoxesService
import { addIcons } from 'ionicons';
import { settingsOutline, cashOutline, walletOutline, checkmarkCircle, ellipseOutline, close } from 'ionicons/icons';

@Component({
  templateUrl: './add-record.page.html',
  styleUrls: ['./add-record.page.scss'],
  imports: [IonCol, IonGrid, IonRow, IonIcon, IonButtons, 
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCard,
    IonCardContent,
    IonText,
    IonListHeader,
    IonDatetimeButton,
    IonModal,
    IonDatetime
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRecordPage implements OnInit, OnDestroy {
  @ViewChild('expenseForm') expenseForm?: NgForm;

  private expensesService = inject(ExpensesService);
  private boxesService = inject(BoxesService);
  private apiService = inject(ApiService);
  private expensesBoxesService = inject(ExpensesBoxesService); // Injected ExpensesBoxesService
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private actionSheetCtrl = inject(ActionSheetController);

  constructor() {
    addIcons({ settingsOutline, cashOutline, walletOutline, checkmarkCircle, ellipseOutline, close });
  }

  private getTodayISOString(): string {
    return new Date().toISOString();
  }

  recordDate = signal<string>(this.getTodayISOString());
  dailyEarnings = signal<number | null>(null);
  netProfit = computed(() => (this.dailyEarnings() ?? 0) - this.totalSelectedBoxesExpenses());

  allBoxes = signal<Box[]>([]);
  selectedBoxControls = signal<Map<number, { boxName: string, cantPriceFields: boolean, quantity: number | null, price: number | null, total: number | null, note: string | null }>>(new Map());

  totalSelectedBoxesExpenses = computed(() => {
    let total = 0;
    this.selectedBoxControls().forEach(control => {
      total += control.total ?? 0;
    });
    return total;
  });

  isEdit = signal(false);
  editingId: number | null = null;

  private routeSub?: Subscription;
  private navEndSub?: Subscription;

  ngOnInit(): void {
    this.allBoxes.set(this.boxesService.getAll());

    this.routeSub = this.route.queryParams.subscribe(params => {
      const idFromQuery = params['id'];
      if (idFromQuery) {
        if (this.editingId !== idFromQuery) {
          this.loadExpenseForEdit(idFromQuery);
        }
      }
      else {
        if (this.isEdit()) {
          this.isEdit.set(false);
          this.editingId = null;
          this.resetForm();
        }
      }
    });

    this.navEndSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const stateId = (history.state as any)?.id;
      if (stateId && this.editingId !== stateId) {
        this.loadExpenseForEdit(stateId);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.navEndSub?.unsubscribe();
  }

  private loadExpenseForEdit(expenseId: string): void {
    const expense = this.expensesService.getById(Number(expenseId));
    if (!expense) return;

    this.isEdit.set(true);
    this.editingId = expense.id ?? null;

    this.recordDate.set(expense.date);
    this.dailyEarnings.set(expense.earnings ?? null);
  }

  async openBoxSelectionActionSheet() {
    const availableBoxes = this.allBoxes();
    if (availableBoxes.length === 0) {
      return;
    }

    const buttons = availableBoxes.map(box => ({
      text: box.name,
      handler: () => {
        this.toggleBoxSelection(box);
      },
      icon: this.selectedBoxControls().has(box.id) ? 'checkmark-circle' : 'ellipse-outline',
    }));

    buttons.push({
      text: 'Cerrar',
      handler: () => { },
      icon: 'close',
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar Cajas para Gastos',
      buttons: buttons,
    });
    await actionSheet.present();
  }

  toggleBoxSelection(box: Box) {
    this.selectedBoxControls.update(map => {
      const newMap = new Map(map);
      if (newMap.has(box.id)) {
        newMap.delete(box.id);
      }
      else {
        newMap.set(box.id, {
          boxName: box.name,
          cantPriceFields: box.cantPriceFields,
          quantity: null,
          price: null,
          total: null,
          note: null
        });
      }
      return newMap;
    });
  }

  handleDynamicInput(boxId: number, field: 'quantity' | 'price' | 'total' | 'note', event: any): void {
    const value = event.detail.value;
    this.selectedBoxControls.update(map => {
      const newMap = new Map(map);
      const control = newMap.get(boxId);
      if (control) {
        if (field === 'quantity' || field === 'price' || field === 'total') {
          const numericValue = parseFloat(String(value).replace(/,/g, ''));
          control[field] = isNaN(numericValue) ? null : numericValue;
          
          if (control.cantPriceFields && (field === 'quantity' || field === 'price')) {
            control.total = (control.quantity ?? 0) * (control.price ?? 0);
            control['note'] = `${control.quantity ?? 0} bultos a $${control.price ?? 0}`;
          }
        } else {
          control[field] = value;
        }
      }
      return newMap;
    });
  }

  async onSubmit(): Promise<void> {
    const earnings = this.dailyEarnings() ?? 0;
    if (this.dailyEarnings() !== null && earnings >= 0) {
      const expenseData: Partial<Expense> = {
        id: this.isEdit() ? this.editingId ?? undefined : undefined,
        date: new Date(this.recordDate()).toISOString().split('T')[0],
        earnings: earnings,
        totalExpenses: this.totalSelectedBoxesExpenses(),
        netProfit: this.netProfit(),
        weeklyBalance: null,
        createdAt: new Date(this.recordDate()).toISOString(),
      };

      let createdExpense: Expense | undefined;

      if (this.isEdit()) {
        this.expensesService.updateExpense(expenseData as Expense);
        createdExpense = expenseData as Expense;
      } else {
        createdExpense = await this.expensesService.addExpense(expenseData);
      }

      if (createdExpense && createdExpense.id) {
        const creationPromises: Promise<any>[] = [];

        for (const [boxId, controlData] of this.selectedBoxControls().entries()) {
          const boxControl: Partial<BoxControl> = {
            boxId: boxId,
            date: expenseData.date,
            origin: controlData.note || 'formulario',
            quantity: controlData.quantity,
            price: controlData.price,
            total: controlData.total ?? 0,
            note: controlData.note,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const createdBoxControl = await this.boxesService.addControlToBox(boxId, boxControl);

          if (createdBoxControl && createdBoxControl.id) {
            const expensesBoxData = {
              expense: createdExpense.id,
              box: boxId,
              boxControl: createdBoxControl.id,
            };
            creationPromises.push(this.expensesBoxesService.addExpenseBox(expensesBoxData));
          }
        }

        await Promise.all(creationPromises);
      }

      this.resetForm();
      this.router.navigate(['/tabs/expenses']);
    }
  }

  resetForm(): void {
    this.expenseForm?.resetForm();
    this.dailyEarnings.set(null);
    this.recordDate.set(this.getTodayISOString());
    this.selectedBoxControls.set(new Map());
    this.isEdit.set(false);
    this.editingId = null;
  }

  handleInput(event: any, signalToUpdate: WritableSignal<number | null>): void {
    const value = event.detail.value;
    if (value === null || value === undefined || value === '') {
        signalToUpdate.set(null);
        return;
    }
    const stringValue = String(value).replace(/,/g, '');
    const numericValue = parseFloat(stringValue);
    signalToUpdate.set(isNaN(numericValue) ? null : numericValue);
  }
}