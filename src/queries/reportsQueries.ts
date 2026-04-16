import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'

export type ReportPeriod = 'weekly' | 'monthly' | 'yearly'

export interface ExpenseReport {
  period?: string
  startDate?: string
  endDate?: string
  data: any
  [key: string]: any
}

export const useFetchExpensesReport = (
  period?: ReportPeriod,
  startDate?: string,
  endDate?: string
) => {
  const fetchExpensesReport = async (): Promise<ExpenseReport> => {
    try {
      let params: Record<string, string> = {}

      if (startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      } else if (period) {
        params.period = period
      } else {
        params.period = 'monthly'
      }

      const res = await axiosInstance.get('/api/reports/expenses', {
        params,
      })

      return res.data?.data ?? res.data ?? {}
    } catch (error) {
      handleApiError(error, 'Expenses Report')
      throw error
    }
  }

  return useQuery({
    queryKey: ['expensesReport', period, startDate, endDate],
    queryFn: fetchExpensesReport,
    staleTime: 5 * 60 * 1000,
  })
}

export const downloadReportPDF = async (
  period?: ReportPeriod,
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  try {
    let params: Record<string, string> = {}

    if (startDate && endDate) {
      params.startDate = startDate
      params.endDate = endDate
    } else if (period) {
      params.period = period
    } else {
      params.period = 'monthly'
    }

    const response = await axiosInstance.get('/api/reports/expenses', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    })

    return response.data as Blob
  } catch (error) {
    handleApiError(error, 'Download Report')
    throw error
  }
}
