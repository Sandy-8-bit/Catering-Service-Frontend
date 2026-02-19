import { apiRoutes } from "@/routes/apiRoutes"
import type { DriverDashboardResponse } from "@/types/driverDash"
import type { DriverOrdersResponse } from "@/types/driverOrderDetail"
import { authHandler } from "@/utils/authHandler"
import axiosInstance from "@/utils/axios"
import { handleApiError } from "@/utils/handleApiError"
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'


export const useFetchDriverDashboard = ({
  driverId,
  date,
}: {
  driverId?: number
  date?: string // format: YYYY-MM-DD
}) => {
  const fetchDashboard = async () => {
    if (!driverId || !date) return []

    try {
      const token = authHandler()

      const res = await axiosInstance.get<DriverDashboardResponse>(
        `${apiRoutes.driverdashboard}/${driverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // params: {
          //   driverId, // query param
          // },
        }
      )

      return res.data?.data ?? res.data ?? []
    } catch (error: unknown) {
      handleApiError(error, 'Driver Dashboard')
      return []
    }
  }

  return useQuery({
    queryKey: ['DRIVER_DASHBOARD', driverId, date],
    queryFn: fetchDashboard,
    enabled: !!driverId && !!date, // important
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export const useFetchDriverOrderDelivery = ({
  orderId,
}: {
  orderId?: number
}) => {
  const fetchOrderDelivery = async () => {
    if (!orderId) return []

    try {
      const token = authHandler()

      const res = await axiosInstance.get<DriverOrdersResponse>(
        `${apiRoutes.driverorder}/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data ?? res.data ?? []
    } catch (error: unknown) {
      handleApiError(error, 'Driver Order Delivery')
      return []
    }
  }

  return useQuery({
    queryKey: ['DRIVER_ORDER_DELIVERY', orderId],
    queryFn: fetchOrderDelivery,
    enabled: !!orderId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}


type VesselPayload = {
  name: string
  quantityGiven: number
}

export const useUpdateDeliveryVessels = () => {
  const queryClient = useQueryClient()

  const updateVessels = async ({
    driverId,
    orderId,
    vessels,
  }: {
    driverId: number
    orderId: number
    vessels: VesselPayload[]
  }) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post(
        `${apiRoutes.driverDeliveries}`,
        {
          driverId,
          orderId,
          vessels,
        }, // ✅ correct request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data
    } catch (error: unknown) {
      handleApiError(error, 'Update Delivery Vessels')
      throw error
    }
  }

  return useMutation({
    mutationFn: updateVessels,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['DRIVER_ORDER_DELIVERY'],
      })
      queryClient.invalidateQueries({
        queryKey: ['DRIVER_DASHBOARD'],
      })
    },
  })
}

