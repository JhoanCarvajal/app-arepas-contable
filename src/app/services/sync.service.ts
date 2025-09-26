import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BoxesService, BoxRecord, Box } from './boxes.service'; // Import Box
import { FinanceService, Submission } from './finance.service'; // Import Submission
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  constructor(
    private apiService: ApiService,
    private boxesService: BoxesService,
    private financeService: FinanceService
  ) { }

  // Helper function to parse and format dates to YYYY-MM-DD
  private _parseAndFormatDateToYYYYMMDD(dateStr: string): string {
    // If it's already YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse as ISO string first (e.g., from createdAt)
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      try {
        return new Date(dateStr).toISOString().split('T')[0];
      } catch (e) {
        // Fallback to other parsing
      }
    }

    const monthMap: { [key: string]: string } = {
      'enero': 'January', 'febrero': 'February', 'marzo': 'March', 'abril': 'April',
      'mayo': 'May', 'junio': 'June', 'julio': 'July', 'agosto': 'August',
      'septiembre': 'September', 'octubre': 'October', 'noviembre': 'November', 'diciembre': 'December'
    };

    const lowerDateStr = dateStr.toLowerCase();
    for (const monthSp in monthMap) {
      if (lowerDateStr.includes(monthSp)) {
        // Handles "10 de septiembre de 2025" -> "10 September 2025"
        const dateWithEnMonth = lowerDateStr.replace(monthSp, monthMap[monthSp]).replace(/ de /g, ' ');
        try {
          return new Date(dateWithEnMonth).toISOString().split('T')[0];
        } catch (e) {
          // Continue to next fallback
        }
      }
    }

    // Handles "DD/MM/YYYY" or "D/M/YYYY"
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        try {
          // new Date(year, monthIndex, day)
          return new Date(Number(year), Number(month) - 1, Number(day)).toISOString().split('T')[0];
        } catch (e) {
          // Continue to next fallback
        }
      }
    }

    // Final fallback: try to parse directly and return YYYY-MM-DD
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      console.warn(`Could not parse date for cleanup: ${dateStr}. Returning current date.`);
      return new Date().toISOString().split('T')[0]; // Return current date as a last resort
    }
  }

  async cleanDatesInLocalStorage(): Promise<void> {
    console.log('Starting date cleanup in localStorage...');

    // Clean History Dates
    const currentHistory = this.financeService.getAll();
    const cleanedHistory: Submission[] = currentHistory.map(item => {
      const cleanedDate = this._parseAndFormatDateToYYYYMMDD(item.date);
      if (item.date !== cleanedDate) {
        console.log(`Cleaned history date: "${item.date}" -> "${cleanedDate}"`);
      }
      return { ...item, date: cleanedDate };
    });
    this.financeService.history.set(cleanedHistory);
    this.financeService['saveToLocalStorage'](); // Access private method

    // Clean Box Records Dates
    const currentBoxes = this.boxesService.getAll();
    const cleanedBoxes: Box[] = currentBoxes.map(box => {
      const cleanedRecords: BoxRecord[] = box.records.map(record => {
        const cleanedDate = this._parseAndFormatDateToYYYYMMDD(record.date);
        if (record.date !== cleanedDate) {
          console.log(`Cleaned box record date: "${record.date}" -> "${cleanedDate}" for box "${box.name}"`);
        }
        return { ...record, date: cleanedDate };
      });
      return { ...box, records: cleanedRecords };
    });
    this.boxesService.boxes.set(cleanedBoxes);
    this.boxesService['saveToLocalStorage'](); // Access private method

    console.log('Date cleanup in localStorage complete!');
  }

  async syncData() {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('No network connection. Skipping sync.');
      return;
    }

    console.log('Starting synchronization...');
    forkJoin({
      apiBoxes: this.apiService.getBoxes(),
      localBoxes: of(this.boxesService.getAll()),
      apiHistory: this.apiService.getHistory(),
      localHistory: of(this.financeService.getAll())
    }).pipe(
      switchMap(({ apiBoxes, localBoxes, apiHistory, localHistory }) => {
        const syncTasks: any[] = [];

        // Sync Boxes (Local to API)
        const boxesToCreate = localBoxes.filter(local => !apiBoxes.find(remote => remote.id === local.id));
        boxesToCreate.forEach(box => {
          console.log(`Syncing local box to API: ${box.name}`);
          syncTasks.push(this.apiService.createBox(box));
        });

        // Sync Boxes (API to Local)
        const boxesToAddToLocal = apiBoxes.filter(remote => !localBoxes.find(local => local.id === remote.id));
        if (boxesToAddToLocal.length > 0) {
            this.boxesService.addBoxes(boxesToAddToLocal);
        }

        // Sync History (Local to API)
        const historyToCreate = localHistory.filter(local => !apiHistory.find(remote => remote.id === local.id));
        historyToCreate.forEach(item => {
          console.log(`Syncing local history to API: ${item.date}`);
          syncTasks.push(this.apiService.createHistory(item));
        });

        // Sync History (API to Local)
        const historyToAddToLocal = apiHistory.filter(remote => !localHistory.find(local => local.id === remote.id));
        if (historyToAddToLocal.length > 0) {
            this.financeService.addRecords(historyToAddToLocal);
        }

        return syncTasks.length > 0 ? forkJoin(syncTasks) : of(null);
      })
    ).subscribe({
      next: () => console.log('Synchronization complete!'),
      error: err => console.error('Synchronization failed:', err)
    });
  }

  async syncBoxRecords(boxId: number) {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('No network connection. Skipping box records sync.');
      return;
    }

    const localBox = this.boxesService.getById(boxId);
    if (!localBox) {
      console.error('Box not found locally');
      return;
    }

    console.log(`Starting synchronization for records of box: ${localBox.name}`);

    this.apiService.getRecordsForBox(boxId).pipe(
      switchMap(apiRecords => {
        const localRecords = localBox.records;
        const syncTasks: any[] = [];

        // Sync Local records to API
        const recordsToCreate = localRecords.filter(local => !apiRecords.find(remote => remote.id === local.id));
        recordsToCreate.forEach(record => {
          console.log(`Syncing local record to API: ${record.id}`);
          syncTasks.push(this.apiService.createRecord(record));
        });

        // Sync API records to Local
        const recordsToAddToLocal = apiRecords.filter(remote => !localRecords.find(local => local.id === remote.id));
        if (recordsToAddToLocal.length > 0) {
          console.log(`Syncing ${recordsToAddToLocal.length} API records to local.`);
          recordsToAddToLocal.forEach((record: BoxRecord) => {
            this.boxesService.addRecordToBoxLocal(boxId, record);
          });
        }

        return syncTasks.length > 0 ? forkJoin(syncTasks) : of(null);
      })
    ).subscribe({
      next: () => console.log(`Record synchronization complete for box: ${localBox.name}`),
      error: err => console.error(`Record synchronization failed for box: ${localBox.name}`, err)
    });
  }
}
