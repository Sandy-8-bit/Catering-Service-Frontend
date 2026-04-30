export type ExpenseCategory =
  | 'RENT'
  | 'SUPPLIES'
  | 'SALARY'
  | 'UTILITIES'
  | 'OTHER'

export interface Expense {
  id: number
  description: string
  amount: number
  category: ExpenseCategory
  expenseDate: string
  notes?: string | null

  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  isActive: boolean
}

export interface ExpensePayload {
  description: string
  amount: number
  category: ExpenseCategory
  expenseDate: string
  notes?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}