import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Network } from '@capacitor/network';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_URL = environment.API_URL;

  constructor(private http: HttpClient) { }

  async isOnlineAndApiAvailable(): Promise<boolean> {
    const status = await Network.getStatus();
    if (!status.connected) {
      console.log('Offline: No network connection.');
      return false;
    }
    try {
      await this.http.get(`${this.API_URL}/`, { responseType: 'text' }).toPromise();
      console.log('Online: API is reachable.');
      return true;
    } catch (error) {
      console.warn('Online: API is not reachable or returned an error.', error);
      return false;
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

  // BOX CONTROLS
  getBoxControlsForBox(boxId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/boxcontrols/`, { params: { box_id: boxId.toString() } });
  }

  createBoxControl(control: any): Observable<any> {
    const { boxId, ...rest } = control;
    const payload = { ...rest, box: boxId };
    return this.http.post<any>(`${this.API_URL}/boxcontrols/`, payload);
  }

  updateBoxControl(id: number, control: any): Observable<any> {
    const { boxId, ...rest } = control;
    const payload = { ...rest, box: boxId };
    return this.http.put<any>(`${this.API_URL}/boxcontrols/${id}/`, payload);
  }

  deleteBoxControl(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/boxcontrols/${id}/`);
  }

  // EXPENSES
  getExpenses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/expenses/`);
  }

  createExpense(expense: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/expenses/`, expense);
  }

  updateExpense(id: number, expense: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/expenses/${id}/`, expense);
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/expenses/${id}/`);
  }

  // WEEKLY BALANCES
  getWeeklyBalances(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/weeklybalances/`);
  }

  createWeeklyBalance(balance: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/weeklybalances/`, balance);
  }

  // EXPENSES BOXES
  getExpensesBoxes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/expensesboxes/`);
  }

  createExpenseBox(expenseBox: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/expensesboxes/`, expenseBox);
  }

  updateExpenseBox(id: number, expenseBox: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/expensesboxes/${id}/`, expenseBox);
  }

  deleteExpenseBox(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/expensesboxes/${id}/`);
  }
}