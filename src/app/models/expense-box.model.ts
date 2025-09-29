export interface ExpenseBox {
  id: number;
  expense: number;
  box: number;
  boxControl: number;
  deletedAt?: string; // ISO date string
}
