export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface RevenueCategory {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface Expense {
  id: string;
  categoryId: string;
  weekStart: string;
  weekEnd: string;
  amount: string;
  description: string | null;
  attachmentPath: string | null;
  category: ExpenseCategory;
}
