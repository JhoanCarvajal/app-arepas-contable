import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Network } from '@capacitor/network'; // Import Network
import { environment } from '../../environments/environment'; // Import environment

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.API_URL; // Use environment variable

  constructor(private http: HttpClient) { }

  /**
   * Checks if the device is online and if the API is reachable.
   * @returns Promise<boolean> - true if online and API is reachable, false otherwise.
   */
  async isOnlineAndApiAvailable(): Promise<boolean> {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('Offline: No network connection.');
      return false;
    }

    try {
      // Attempt a simple GET request to the API root to check reachability
      // Use a short timeout to avoid long waits if API is truly down
      await this.http.get(`${this.API_URL}/`, { responseType: 'text' }).toPromise();
      console.log('Online: API is reachable.');
      return true;
    } catch (error) {
      console.warn('Online: API is not reachable or returned an error.', error);
      return false;
    }
  }

  private parseAndFormatDate(dateStr: string): string {
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

  // BOXES
  getBoxes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/boxes/`);
  }

  createBox(box: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/boxes/`, box);
  }

  updateBox(id: number, box: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/boxes/${id}/`, box);
  }

  deleteBox(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/boxes/${id}/`);
  }

  // RECORDS
  getRecordsForBox(boxId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/records/`, { params: { box_id: boxId.toString() } });
  }

  createRecord(record: any): Observable<any> {
    const { boxId, ...rest } = record;
    const payload = {
      ...rest,
      box: boxId,
      date: this.parseAndFormatDate(record.date),
    };
    return this.http.post<any>(`${this.API_URL}/records/`, payload);
  }

  updateRecord(id: number, record: any): Observable<any> {
    const { boxId, ...rest } = record;
    const payload = {
      ...rest,
      box: boxId,
      date: this.parseAndFormatDate(record.date),
    };
    return this.http.put<any>(`${this.API_URL}/records/${id}/`, payload);
  }

  deleteRecord(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/records/${id}/`);
  }

  // HISTORY
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/history/`);
  }

  createHistory(historyItem: any): Observable<any> {
    const payload = {
      ...historyItem,
      date: this.parseAndFormatDate(historyItem.date),
    };
    return this.http.post<any>(`${this.API_URL}/history/`, payload);
  }

  updateHistory(id: number, historyItem: any): Observable<any> {
    const payload = {
      ...historyItem,
      date: this.parseAndFormatDate(historyItem.date),
    };
    return this.http.put<any>(`${this.API_URL}/history/${id}/`, payload);
  }

  deleteHistory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/history/${id}/`);
  }
}
