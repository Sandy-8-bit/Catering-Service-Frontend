import { apiRoutes } from '@/routes/apiRoutes'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery } from '@tanstack/react-query'

export interface DashboardOrder {
  orderId: number
  customerName: string
  customerPhone: string
  eventDate: string
  totalPlates: number | null
  grandTotalAmount: number | null
  balanceAmount: number
  orderStatus: string
  paymentStatus: string
}

export interface DashboardPayment {
  orderId: number
  customerName: string
  customerPhone: string
  eventDate: string
  grandTotalAmount: number | null
  advanceAmount: number
  balanceAmount: number
  paymentStatus: string
}

export interface DashboardKPI {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  totalPendingPayments: number
  totalOrders: number
  totalPlates: number
}

export interface DashboardData {
  period: string
  startDate: string
  endDate: string
  kpi: DashboardKPI
  orders: {
    pending: DashboardOrder[]
    outForDelivery: DashboardOrder[]
    completed: DashboardOrder[]
  }
  pendingPayments: DashboardPayment[]
  returnableItems: unknown[]
}

export type PeriodType =   'MONTHLY'  

export const useFetchDashboard = (
  period: PeriodType,
  dateRange?: { startDate: string; endDate: string }
) => {
  const fetchDashboard = async (): Promise<DashboardData> => {
    try {
      const token = authHandler()
      const params: Record<string, string> = {}

      if (dateRange) {
        params.startDate = dateRange.startDate
        params.endDate = dateRange.endDate
      } else {
        params.period = period
      }

      const res = await axiosInstance.get(apiRoutes.dashboard, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      })

      return (res.data?.data ?? res.data ?? {}) as DashboardData
    } catch (error: unknown) {
      handleApiError(error, 'Dashboard')
      throw error
    }
  }

  return useQuery({
    queryKey: ['dashboard', period, dateRange],
    queryFn: fetchDashboard,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}
