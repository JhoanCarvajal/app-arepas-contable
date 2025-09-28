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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
  IonListHeader,
  IonDatetimeButton,
  IonModal,
  IonDatetime
} from '@ionic/angular/standalone';
import { ExpensesService, Expense } from '../../services/expenses.service';

@Component({
  templateUrl: './add-record.page.html',
  styleUrls: ['./add-record.page.scss'],
  imports: [
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
    IonGrid,
    IonRow,
    IonCol,
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
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

  private getTodayISOString(): string {
    return new Date().toISOString();
  }

  // Form inputs
  recordDate = signal<string>(this.getTodayISOString());
  dailyEarnings = signal<number | null>(null);
  totalExpenses = signal<number | null>(null); // User will input this directly now

  // Computed totals for the form (real-time summary)
  netProfit = computed(() => (this.dailyEarnings() ?? 0) - (this.totalExpenses() ?? 0));

  // Edit flags
  isEdit = signal(false);
  editingId: number | null = null;

  private routeSub?: Subscription;
  private navEndSub?: Subscription;

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      const idFromQuery = params['id'];
      if (idFromQuery) {
        if (this.editingId !== idFromQuery) {
          this.loadExpenseForEdit(idFromQuery);
        }
      } else {
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
    this.totalExpenses.set(expense.totalExpenses ?? null);
  }

  onSubmit(): void {
    const earnings = this.dailyEarnings() ?? 0;
    if (this.dailyEarnings() !== null && earnings >= 0) {
      // For now, weeklyBalance will be a placeholder. This needs to be implemented.
      const expenseData: Partial<Expense> = {
        id: this.isEdit() ? this.editingId ?? undefined : undefined,
        date: new Date(this.recordDate()).toISOString().split('T')[0],
        earnings: earnings,
        totalExpenses: this.totalExpenses() ?? 0,
        netProfit: this.netProfit(),
        weeklyBalance: 1, // Placeholder, needs implementation
        createdAt: new Date(this.recordDate()).toISOString(),
      };

      if (this.isEdit()) {
        this.expensesService.updateExpense(expenseData as Expense);
      } else {
        this.expensesService.addExpense(expenseData);
      }

      this.resetForm();
      this.router.navigate(['/tabs/expenses']);
    }
  }

  resetForm(): void {
    this.expenseForm?.resetForm();
    this.dailyEarnings.set(null);
    this.totalExpenses.set(null);
    this.recordDate.set(this.getTodayISOString());
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
