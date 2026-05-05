import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { authHandler } from '@/utils/authHandler' // 👈 make sure this is imported

export type ReportPeriod = 'MONTHLY'

export interface ExpenseReport {
  totalGlobalIncome: number
  totalGlobalMiscExpense: number
  totalGlobalNetProfit: number
  totalGlobalPeopleServed: number
  orderDetails: any[]
}

export const useFetchExpensesReport = (
  period?: ReportPeriod,
  startDate?: string,
  endDate?: string
) => {
  const fetchExpensesReport = async (): Promise<ExpenseReport> => {
    try {
      const token = authHandler() // ✅ get token from cookies

      const params: Record<string, string> = {}

      if (startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      } else if (period) {
        params.period = period
      }

      const res = await axiosInstance.get('/api/admin/reports/finance', {
        params,
        headers: {
          Authorization: `Bearer ${token}`, // ✅ attach token
        },
      })

      if (!res.data?.data) {
        throw new Error('Invalid API response')
      }

      return res.data.data as ExpenseReport
    } catch (error) {
      handleApiError(error, 'Expenses Report')
      throw error
    }
  }

  return useQuery({
    queryKey: ['expensesReport', period, startDate, endDate],
    queryFn: fetchExpensesReport,

    // ✅ only call API when inputs are ready
    enabled: !!(period || (startDate && endDate)),

    staleTime: 5 * 60 * 1000,
  })
}

export const downloadReportPDF = async (
  period?: ReportPeriod,
  startDate?: string,
  endDate?: string
): Promise<Blob> => {
  try {
    const token = authHandler() // ✅ add this

    let params: Record<string, string> = {}

    if (startDate && endDate) {
      params.startDate = startDate
      params.endDate = endDate
    } else if (period) {
      params.period = period
    } else {
      params.period = 'monthly'
    }

    const response = await axiosInstance.get('/api/admin/reports/finance', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
        Authorization: `Bearer ${token}`, // ✅ add this
      },
    })

    return response.data as Blob
  } catch (error) {
    handleApiError(error, 'Download Report')
    throw error
  }
}