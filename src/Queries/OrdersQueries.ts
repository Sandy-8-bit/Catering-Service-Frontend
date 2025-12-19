import { apiRoutes } from '@/routes/apiRoutes'
import type { Order, OrderPayload, OrderUpdatePayload } from '@/types/Order'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const ORDERS_KEY = ['orders'] as const
const orderKey = (id: number | string) => [...ORDERS_KEY, id] as const

export const useFetchOrders = ({
  year,
  month,
  date,
}: {
  year?: number
  month?: number
  date?: number
}) => {
  const fetchAll = async (): Promise<Order[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(apiRoutes.orders + '/summary', {
        headers: { Authorization: `Bearer ${token}` },
        params: { year, month, date },
      })

      return (res.data?.data ?? res.data ?? []) as Order[]
    } catch (error: unknown) {
      handleApiError(error, 'Orders')
    }
  }

  return useQuery({
    queryKey: [ORDERS_KEY, year, month, date],
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export const useFetchOrderById = (id?: number) => {
  console.log(id)
  const fetchById = async (): Promise<Order> => {
    try {
      if (!id && id !== 0) {
        throw new Error('Order id is required')
      }

      const token = authHandler()

      const res = await axiosInstance.get(`${apiRoutes.orders}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      return (res.data?.data ?? res.data) as Order
    } catch (error: unknown) {
      handleApiError(error, 'Fetch Order')
    }
  }

  return useQuery({
    queryKey: orderKey(id ?? 'unknown'),
    queryFn: fetchById,
    enabled: typeof id === 'number' && id > 0,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()

  const createOrder = async (payload: OrderPayload) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post(apiRoutes.orders, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status !== 201 && res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to create order')
      }

      return res.data?.data as Order
    } catch (error: unknown) {
      handleApiError(error, 'Create order')
    }
  }

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success('Order created successfully')
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: orderKey(data.id) })
      }
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()

  const updateOrder = async ({ id, ...payload }: OrderUpdatePayload) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.patch(
        `${apiRoutes.orders}/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to update order')
      }

      return res.data?.data as Order
    } catch (error: unknown) {
      handleApiError(error, 'Update order')
    }
  }

  return useMutation({
    mutationFn: updateOrder,
    onSuccess: (data, variables) => {
      toast.success('Order updated successfully')
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: orderKey(variables.id) })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()

  const deleteOrder = async (orderId: number) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.delete(`${apiRoutes.orders}/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status !== 204) {
        throw new Error(res.data?.message || 'Failed to delete order')
      }

      return true
    } catch (error: unknown) {
      handleApiError(error, 'Delete order')
    }
  }

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_data, orderId) => {
      toast.success('Order deleted successfully')
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
      queryClient.invalidateQueries({ queryKey: orderKey(orderId) })
    },
  })
}
