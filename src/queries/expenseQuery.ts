/**
 * ---------------------------------------
 * Expense Service Hooks - CRUD Operations
 * ---------------------------------------
 *
 * Endpoints:
 * GET    /api/admin/expenses
 * GET    /api/admin/expenses/{id}
 * POST   /api/admin/expenses
 * PUT    /api/admin/expenses/{id}
 * DELETE /api/admin/expenses/{id}
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/utils/axios'
import { authHandler } from '@/utils/authHandler'
import { handleApiError } from '@/utils/handleApiError'
import { toast } from 'react-hot-toast'
import type { Expense, ExpensePayload, ApiResponse } from '@/types/expense'

/**
 * Query Keys
 */
const EXPENSE_KEY = ['expenses'] as const
const expenseKey = (id: number | string) => [...EXPENSE_KEY, id] as const

/**
 * 🔍 Fetch all expenses
 */
export const useFetchExpenses = (params?: {
  startDate?: string
  endDate?: string
}) => {
  const fetchExpenses = async (): Promise<Expense[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get<ApiResponse<Expense[]>>(
        `/api/admin/expenses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            ...(params?.startDate && { startDate: params.startDate }),
            ...(params?.endDate && { endDate: params.endDate }),
          },
        }
      )

      return res.data?.data ?? []
    } catch (error: unknown) {
      handleApiError(error, 'Expenses')
      return []
    }
  }

  return useQuery({
    queryKey: [EXPENSE_KEY, params], // 🔥 important for refetch
    queryFn: fetchExpenses,
    staleTime: 1000 * 60 * 5,
  })
}
/**
 * 🔍 Fetch expense by ID
 */
export const useFetchExpenseById = (id?: number) => {
  const fetchExpense = async (): Promise<Expense> => {
    try {
      if (!id) throw new Error('Expense ID required')

      const token = authHandler()

      const res = await axiosInstance.get<ApiResponse<Expense>>(
        `/api/admin/expenses/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.data
    } catch (error: unknown) {
      handleApiError(error, 'Expense')
      throw error
    }
  }

  return useQuery({
    queryKey: expenseKey(id ?? 'unknown'),
    queryFn: fetchExpense,
    enabled: !!id,
  })
}

/**
 * ➕ Create expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  const createExpense = async (payload: ExpensePayload): Promise<Expense> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post<ApiResponse<Expense>>(
        `/api/admin/expenses`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.data
    } catch (error: unknown) {
      handleApiError(error, 'Create Expense')
      throw error
    }
  }

  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success('Expense created successfully')
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEY })
    },
  })
}

/**
 * ✏️ Update expense
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  const updateExpense = async ({
    id,
    payload,
  }: {
    id: number
    payload: ExpensePayload
  }): Promise<Expense> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.put<ApiResponse<Expense>>(
        `/api/admin/expenses/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.data
    } catch (error: unknown) {
      handleApiError(error, 'Update Expense')
      throw error
    }
  }

  return useMutation({
    mutationFn: updateExpense,
    onSuccess: (_data, variables) => {
      toast.success('Expense updated successfully')

      queryClient.invalidateQueries({ queryKey: EXPENSE_KEY })
      queryClient.invalidateQueries({
        queryKey: expenseKey(variables.id),
      })
    },
  })
}

/**
 * ❌ Delete expense
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  const deleteExpense = async (id: number) => {
    try {
      const token = authHandler()

      await axiosInstance.delete(`/api/admin/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return true
    } catch (error: unknown) {
      handleApiError(error, 'Delete Expense')
      throw error
    }
  }

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      toast.success('Expense deleted successfully')
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEY })
    },
  })
}