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
export class AddRecordPage implements OnInit, OnDestroy {
  @ViewChild('financeForm') financeForm?: NgForm;

  private financeService = inject(FinanceService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);

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

  // Nuevo: flags para edición
  isEdit = signal(false);
  editingCreatedAt: string | null = null;

  private routeSub?: Subscription;
  private navEndSub?: Subscription;

  ngOnInit(): void {
    // Suscribirse a cambios en queryParams (se emite aunque el componente ya exista)
    this.routeSub = this.route.queryParams.subscribe(params => {
      const idFromQuery = params['id'];
      if (idFromQuery) {
        if (this.editingCreatedAt !== idFromQuery) {
          this.loadSubmissionForEdit(idFromQuery);
        }
      } else {
        // Si navegamos sin id y estábamos en modo edición, salir del modo edición
        if (this.isEdit()) {
          this.isEdit.set(false);
          this.editingCreatedAt = null;
          this.resetForm();
        }
      }
    });

    // También detectar navigation state (router.navigate(..., { state })) aunque queryParams no cambie
    this.navEndSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const stateId = (history.state as any)?.id;
      if (stateId && this.editingCreatedAt !== stateId) {
        this.loadSubmissionForEdit(stateId);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.navEndSub?.unsubscribe();
  }

  private loadSubmissionForEdit(createdAt: string): void {
    const sub = this.financeService.getSubmission(createdAt);
    if (!sub) return;

    this.isEdit.set(true);
    this.editingCreatedAt = sub.createdAt;

    // Mapear valores al formulario (signals)
    // fecha: guardamos la ISO en recordDate para el datetime control
    // Convertimos la `date` de presentación si hace falta, pero preferimos usar createdAt como id
    this.recordDate.set(new Date(sub.createdAt).toISOString());

    this.dailyEarnings.set(sub.earnings ?? null);
    this.generalExpenses.set(sub.generalExpenses ?? null);
    this.operatingExpenses.set(sub.operatingExpenses ?? null);
    this.workerExpenses.set(sub.workerExpenses ?? null);
    this.rentExpenses.set(sub.rentExpenses ?? null);
    this.motorcycleExpenses.set(sub.motorcycleExpenses ?? null);

    this.cornBags.set(sub.cornBags ?? null);
    this.cornPrice.set(sub.cornPrice ?? null);

    this.charcoalBags.set(sub.charcoalBags ?? null);
    this.charcoalPrice.set(sub.charcoalPrice ?? null);
  }

  onSubmit(): void {
    const earnings = this.dailyEarnings() ?? 0;
    if (this.dailyEarnings() !== null && earnings >= 0) {
      const submissionBase: Submission = {
        // Si estamos en edición preservamos createdAt; en creación lo añadirá addSubmission
        createdAt: this.isEdit() && this.editingCreatedAt ? this.editingCreatedAt : new Date().toISOString(),
        date: new Date(this.recordDate()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
        earnings: earnings,
        // Detalle completo para permitir edición posterior
        generalExpenses: this.generalExpenses(),
        operatingExpenses: this.operatingExpenses(),
        workerExpenses: this.workerExpenses(),
        rentExpenses: this.rentExpenses(),
        motorcycleExpenses: this.motorcycleExpenses(),

        cornBags: this.cornBags(),
        cornPrice: this.cornPrice(),

        charcoalBags: this.charcoalBags(),
        charcoalPrice: this.charcoalPrice(),

        totalExpenses: this.totalExpenses(),
        netProfit: this.netProfit(),
      };

      if (this.isEdit()) {
        this.financeService.updateSubmission(submissionBase);
      } else {
        // addSubmission volverá a crear createdAt
        this.financeService.addSubmission(submissionBase);
      }

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