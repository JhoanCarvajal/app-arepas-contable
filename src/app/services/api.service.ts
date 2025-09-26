import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = 'http://127.0.0.1:8000/api/v1';

  constructor(private http: HttpClient) { }

  private parseAndFormatDate(dateStr: string): string {
    // Check if it's already a valid ISO-like string
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      try {
        return new Date(dateStr).toISOString();
      } catch (e) {
        // Fallback if it's a weird format
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
        const dateWithEnMonth = lowerDateStr.replace(monthSp, monthMap[monthSp]).replace(/ de /g, ' ');
        try {
          // Handles "10 September 2025"
          return new Date(dateWithEnMonth).toISOString();
        } catch (e) {
          // Continue to next fallback
        }
      }
    }

    // Fallback for other formats that new Date() might understand, or if parsing fails
    try {
      return new Date(dateStr).toISOString();
    } catch (e) {
      console.error(`Could not parse date: ${dateStr}`);
      // Return a value that won't crash, though it might be incorrect
      return new Date().toISOString();
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