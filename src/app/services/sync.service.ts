import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { BoxesService, BoxControl, Box } from './boxes.service';
import { ExpensesService, Expense } from './expenses.service';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiService = inject(ApiService);
  private boxesService = inject(BoxesService);
  private expensesService = inject(ExpensesService);

  constructor() { }

  // The date cleanup logic can be removed after the user runs it once.
  // For now, I'll leave it in case it's needed again, but with correct typings.
  private _parseAndFormatDateToYYYYMMDD(dateStr: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch (e) { /* fallback */ }
    }
    const monthMap: { [key: string]: string } = {
      'enero': 'January', 'febrero': 'February', 'marzo': 'March', 'abril': 'April',
      'mayo': 'May', 'junio': 'June', 'julio': 'July', 'agosto': 'August',
      'septiembre': 'September', 'octubre': 'October', 'noviembre': 'November', 'diciembre': 'December'
    };
    const lowerDateStr = dateStr.toLowerCase();
    for (const monthSp in monthMap) {
      if (lowerDateStr.includes(monthSp)) {
        const dateWithEnMonth = lowerDateStr.replace(monthSp, monthMap[monthSp]).replace(/ de /g, ' ');
        try {
          return new Date(dateWithEnMonth).toISOString().split('T')[0];
        } catch (e) { /* fallback */ }
      }
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        try {
          return new Date(Number(year), Number(month) - 1, Number(day)).toISOString().split('T')[0];
        } catch (e) { /* fallback */ }
      }
    }
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      console.warn(`Could not parse date for cleanup: ${dateStr}. Returning current date.`);
      return new Date().toISOString().split('T')[0];
    }
  }

  async cleanDatesInLocalStorage(): Promise<void> {
    console.log('Starting date cleanup in localStorage...');

    const currentExpenses = this.expensesService.getAll();
    const cleanedExpenses: Expense[] = currentExpenses.map((item: Expense) => {
      const cleanedDate = this._parseAndFormatDateToYYYYMMDD(item.date);
      if (item.date !== cleanedDate) {
        console.log(`Cleaned expense date: "${item.date}" -> "${cleanedDate}"`);
      }
      return { ...item, date: cleanedDate };
    });
    this.expensesService.expenses.set(cleanedExpenses);
    this.expensesService['saveToLocalStorage']();

    const currentBoxes = this.boxesService.getAll();
    const cleanedBoxes: Box[] = currentBoxes.map(box => {
      const cleanedControls: BoxControl[] = box.controls.map((control: BoxControl) => {
        const cleanedDate = this._parseAndFormatDateToYYYYMMDD(control.date);
        if (control.date !== cleanedDate) {
          console.log(`Cleaned box control date: "${control.date}" -> "${cleanedDate}" for box "${box.name}"`);
        }
        return { ...control, date: cleanedDate };
      });
      return { ...box, controls: cleanedControls };
    });
    this.boxesService.boxes.set(cleanedBoxes);
    this.boxesService['saveToLocalStorage']();

    console.log('Date cleanup in localStorage complete!');
  }

  async syncData() {
    if (!await this.apiService.isOnlineAndApiAvailable()) {
      console.log('Offline or API not available. Skipping sync.');
      return;
    }

    console.log('Starting synchronization...');
    forkJoin({
      apiBoxes: this.apiService.getBoxes(),
      localBoxes: of(this.boxesService.getAll()),
      apiExpenses: this.apiService.getExpenses(),
      localExpenses: of(this.expensesService.getAll())
    }).pipe(
      switchMap(({ apiBoxes, localBoxes, apiExpenses, localExpenses }) => {
        const syncTasks: any[] = [];

        const boxesToCreate = localBoxes.filter(local => !apiBoxes.find(remote => remote.id === local.id));
        boxesToCreate.forEach(box => {
          console.log(`Syncing local box to API: ${box.name}`);
          syncTasks.push(this.apiService.createBox(box));
        });

        const boxesToAddToLocal = apiBoxes.filter(remote => !localBoxes.find(local => local.id === remote.id));
        if (boxesToAddToLocal.length > 0) {
          this.boxesService.addBoxes(boxesToAddToLocal);
        }

        const expensesToCreate = localExpenses.filter(local => !apiExpenses.find(remote => remote.id === local.id));
        expensesToCreate.forEach((item: Expense) => {
          console.log(`Syncing local expense to API: ${item.date}`);
          syncTasks.push(this.apiService.createExpense(item));
        });

        const expensesToAddToLocal = apiExpenses.filter(remote => !localExpenses.find(local => local.id === remote.id));
        if (expensesToAddToLocal.length > 0) {
          this.expensesService.addExpenses(expensesToAddToLocal);
        }

        return syncTasks.length > 0 ? forkJoin(syncTasks) : of(null);
      })
    ).subscribe({
      next: () => console.log('Synchronization complete!'),
      error: (err: any) => console.error('Synchronization failed:', err)
    });
  }

  async syncBoxControls(boxId: number) {
    if (!await this.apiService.isOnlineAndApiAvailable()) {
      console.log('Offline or API not available. Skipping box controls sync.');
      return;
    }

    const localBox = this.boxesService.getById(boxId);
    if (!localBox) {
      console.error('Box not found locally');
      return;
    }

    console.log(`Starting synchronization for controls of box: ${localBox.name}`);

    this.apiService.getBoxControlsForBox(boxId).pipe(
      switchMap(apiControls => {
        const localControls = localBox.controls;
        const syncTasks: any[] = [];

        const controlsToCreate = localControls.filter(local => !apiControls.find(remote => remote.id === local.id));
        controlsToCreate.forEach((control: BoxControl) => {
          console.log(`Syncing local control to API: ${control.id}`);
          syncTasks.push(this.apiService.createBoxControl(control));
        });

        const controlsToAddToLocal = apiControls.filter(remote => !localControls.find(local => local.id === remote.id));
        if (controlsToAddToLocal.length > 0) {
          console.log(`Syncing ${controlsToAddToLocal.length} API controls to local.`);
          controlsToAddToLocal.forEach((control: BoxControl) => {
            this.boxesService.addControlToBoxLocal(boxId, control);
          });
        }

        return syncTasks.length > 0 ? forkJoin(syncTasks) : of(null);
      })
    ).subscribe({
      next: () => console.log(`Control synchronization complete for box: ${localBox.name}`),
      error: (err: any) => console.error(`Control synchronization failed for box: ${localBox.name}`, err)
    });
  }
}