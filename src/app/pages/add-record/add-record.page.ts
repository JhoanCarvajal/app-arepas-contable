import { Component, signal, ChangeDetectionStrategy, computed, WritableSignal, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
import { FinanceService, Submission } from '../../services/finance.service';

@Component({
  templateUrl: './add-record.page.html',
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
export class AddRecordPage {
  @ViewChild('financeForm') financeForm?: NgForm;

  private financeService = inject(FinanceService);
  private router: Router = inject(Router);

  private getTodayISOString(): string {
    return new Date().toISOString();
  }

  // Form inputs
  recordDate = signal<string>(this.getTodayISOString());
  dailyEarnings = signal<number | null>(null);
  generalExpenses = signal<number | null>(null);
  operatingExpenses = signal<number | null>(null);
  workerExpenses = signal<number | null>(null);
  rentExpenses = signal<number | null>(null);
  motorcycleExpenses = signal<number | null>(null);
  
  cornBags = signal<number | null>(null);
  cornPrice = signal<number | null>(null);
  
  charcoalBags = signal<number | null>(null);
  charcoalPrice = signal<number | null>(null);

  // Computed totals for specific items
  cornTotal = computed(() => (this.cornBags() ?? 0) * (this.cornPrice() ?? 0));
  charcoalTotal = computed(() => (this.charcoalBags() ?? 0) * (this.charcoalPrice() ?? 0));

  // Computed totals for the form (real-time summary)
  totalExpenses = computed(() => {
    return (
      this.cornTotal() +
      this.charcoalTotal() +
      (this.generalExpenses() ?? 0) +
      (this.operatingExpenses() ?? 0) +
      (this.workerExpenses() ?? 0) +
      (this.rentExpenses() ?? 0) +
      (this.motorcycleExpenses() ?? 0)
    );
  });

  netProfit = computed(() => (this.dailyEarnings() ?? 0) - this.totalExpenses());

  onSubmit(): void {
    const earnings = this.dailyEarnings() ?? 0;
    if (this.dailyEarnings() !== null && earnings >= 0) {
      const newSubmission: Submission = {
        createdAt: new Date().toISOString(),
        date: new Date(this.recordDate()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        earnings: earnings,
        totalExpenses: this.totalExpenses(),
        netProfit: this.netProfit(),
      };

      this.financeService.addSubmission(newSubmission);
      this.resetForm();
      this.router.navigate(['/tabs/history']);
    }
  }

  resetForm(): void {
    // Reset form visually
    this.financeForm?.resetForm();

    // Reset signals
    this.dailyEarnings.set(null);
    this.generalExpenses.set(null);
    this.operatingExpenses.set(null);
    this.workerExpenses.set(null);
    this.rentExpenses.set(null);
    this.motorcycleExpenses.set(null);
    this.cornBags.set(null);
    this.cornPrice.set(null);
    this.charcoalBags.set(null);
    this.charcoalPrice.set(null);
    
    this.recordDate.set(this.getTodayISOString());
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