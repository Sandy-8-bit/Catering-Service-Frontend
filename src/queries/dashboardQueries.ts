import { apiRoutes } from '@/routes/apiRoutes'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery } from '@tanstack/react-query'

export type PeriodType = 'MONTHLY'

export const useFetchDashboard = (
  period: PeriodType,
  dateRange?: { startDate: string; endDate: string }
) => {
  const fetchDashboard = async () => {
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

      const raw = res.data?.data ?? res.data ?? {}

      const allOrders = raw?.orders?.orders || []

      // 🔥 TRANSFORM HERE
      const transformedOrders = {
        pending: allOrders.filter(
          (o: any) =>
            o.orderStatus === 'Pending' ||
            o.orderStatus === 'Order Placed'
        ),
        completed: allOrders.filter(
          (o: any) => o.orderStatus === 'Order Completed'
        ),
        outForDelivery: allOrders.filter(
          (o: any) => o.orderStatus === 'Out for Delivery'
        ),
      }

      return {
        period: raw.period,
        startDate: raw.from,
        endDate: raw.to,
        kpi: raw.kpi,
        orders: transformedOrders,
        pendingPayments: raw.pendingPayments || [],
        returnableItems: raw.returnableItems || [],
      }
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