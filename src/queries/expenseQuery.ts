/**
 * ---------------------------------------
 * Expense Service Hooks - CRUD Operations
 * ---------------------------------------
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import axiosInstance from '@/utils/axios'
import { authHandler } from '@/utils/authHandler'
import { handleApiError } from '@/utils/handleApiError'
import { toast } from 'react-hot-toast'

import type {
  Expense,
  ExpensePayload,
  ApiResponse,
} from '@/types/expense'

/* -------------------------------------------------------------------------- */
/*                                  QUERY KEYS                                */
/* -------------------------------------------------------------------------- */

export const expenseKeys = {
  all: ['expenses'] as const,

  lists: () => [...expenseKeys.all, 'list'] as const,

  list: (params?: {
    startDate?: string
    endDate?: string
  }) => [...expenseKeys.lists(), params] as const,

  details: () => [...expenseKeys.all, 'detail'] as const,

  detail: (id: number | string) =>
    [...expenseKeys.details(), id] as const,
}

/* -------------------------------------------------------------------------- */
/*                             FETCH ALL EXPENSES                             */
/* -------------------------------------------------------------------------- */

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
            ...(params?.startDate && {
              startDate: params.startDate,
            }),

            ...(params?.endDate && {
              endDate: params.endDate,
            }),
          },
        }
      )

      return res.data?.data ?? []
    } catch (error: unknown) {
      handleApiError(error, 'Fetch Expenses')
      return []
    }
  }

  return useQuery({
    queryKey: expenseKeys.list(params),

    queryFn: fetchExpenses,

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: true,
  })
}

/* -------------------------------------------------------------------------- */
/*                           FETCH EXPENSE BY ID                              */
/* -------------------------------------------------------------------------- */

export const useFetchExpenseById = (id?: number) => {
  const fetchExpense = async (): Promise<Expense> => {
    try {
      if (!id) {
        throw new Error('Expense ID required')
      }

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
      handleApiError(error, 'Fetch Expense')
      throw error
    }
  }

  return useQuery({
    queryKey: expenseKeys.detail(id ?? 'unknown'),

    queryFn: fetchExpense,

    enabled: !!id,
  })
}

/* -------------------------------------------------------------------------- */
/*                               CREATE EXPENSE                               */
/* -------------------------------------------------------------------------- */

export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  const createExpense = async (
    payload: ExpensePayload
  ): Promise<Expense> => {
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

    onSuccess: async () => {
      toast.success('Expense created successfully')

      await queryClient.invalidateQueries({
        queryKey: expenseKeys.lists(),
      })

      await queryClient.refetchQueries({
        queryKey: expenseKeys.lists(),
      })
    },
  })
}

/* -------------------------------------------------------------------------- */
/*                               UPDATE EXPENSE                               */
/* -------------------------------------------------------------------------- */

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

    onSuccess: async (_data, variables) => {
      toast.success('Expense updated successfully')

      /* Refetch all expense lists */
      await queryClient.invalidateQueries({
        queryKey: expenseKeys.lists(),
      })

      /* Refetch single expense */
      await queryClient.invalidateQueries({
        queryKey: expenseKeys.detail(variables.id),
      })

      /* Force refetch */
      await queryClient.refetchQueries({
        queryKey: expenseKeys.lists(),
      })

      await queryClient.refetchQueries({
        queryKey: expenseKeys.detail(variables.id),
      })
    },
  })
}

/* -------------------------------------------------------------------------- */
/*                               DELETE EXPENSE                               */
/* -------------------------------------------------------------------------- */

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  const deleteExpense = async (id: number) => {
    try {
      const token = authHandler()

      await axiosInstance.delete(
        `/api/admin/expenses/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return id
    } catch (error: unknown) {
      handleApiError(error, 'Delete Expense')
      throw error
    }
  }

  return useMutation({
    mutationFn: deleteExpense,

    onSuccess: async (deletedId) => {
      toast.success('Expense deleted successfully')

      /* Remove deleted expense cache */
      queryClient.removeQueries({
        queryKey: expenseKeys.detail(deletedId),
      })

      /* Invalidate all lists */
      await queryClient.invalidateQueries({
        queryKey: expenseKeys.lists(),
      })

      /* Force refetch */
      await queryClient.refetchQueries({
        queryKey: expenseKeys.lists(),
      })
    },
  })
}