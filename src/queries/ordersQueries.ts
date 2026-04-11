import { apiRoutes } from '@/routes/apiRoutes'
import type { Order, OrderPayload, OrderUpdatePayload } from '@/types/order'
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

      const order = (res.data?.data ?? res.data) as Partial<Order> & {
        driverId?: number
        driverName?: string
      }

      // Transform flat driver properties to nested structure for UI compatibility
      if (order.driverId) {
        order.driver = {
          driverId: order.driverId,
          driverName: order.driverName ?? '',
          driverNumber: '',
        }
      }

      // Transform flat item structure to nested product structure for UI compatibility
      if (order.items && Array.isArray(order.items)) {
        order.items = order.items.map(
          (
            item: Partial<(typeof order.items)[number]> & {
              productId?: number
              productPrimaryName?: string
              productSecondaryName?: string
            }
          ) => {
            // If item already has nested product, return as is
            if (item.product) {
              return item as Order['items'][number]
            }
            // If item has flat structure, nest it
            return {
              id: item.id ?? 0,
              product: {
                productId: item.productId ?? 0,
                productPrimaryName: item.productPrimaryName ?? '',
                productSecondaryName: item.productSecondaryName ?? '',
                primaryName: item.productPrimaryName ?? '',
                secondaryName: item.productSecondaryName ?? '',
              },
              productPrimaryName: item.productPrimaryName ?? '',
              productSecondaryName: item.productSecondaryName ?? '',
              quantity: item.quantity ?? 0,
              unitPrice: item.unitPrice ?? 0,
              totalPrice: item.totalPrice ?? 0,
            }
          }
        )
      }

      return order as Order
    } catch (error: unknown) {
      handleApiError(error, 'Fetch Order')
    }
  }

  return useQuery({
    queryKey: orderKey(id ?? 'unknown'),
    queryFn: fetchById,
    enabled: !!id,
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

  const updateOrder = async (editData: OrderUpdatePayload) => {
    try {
      const token = authHandler()
      const { id, ...payload } = editData
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
    onSuccess: () => {
      toast.success('Order updated successfully')
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()

  const deleteOrder = async (orderId: number) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.delete(
        `${apiRoutes.orders}/${orderId}/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

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

export const useUploadVoiceOrder = () => {
  const queryClient = useQueryClient()

  const uploadVoiceOrder = async (payload: {
    file: Blob
    customerName: string
    eventDate: string
  }) => {
    try {
      const token = authHandler()

      // Determine file extension based on MIME type
      const extension = payload.file.type.includes('wav')
        ? 'recording.wav'
        : 'recording.webm'

      // Create a proper File object from the Blob
      const audioFile = new File([payload.file], extension, {
        type: payload.file.type || 'audio/wav',
      })

      const formData = new FormData()
      formData.append('file', audioFile)
      formData.append('customerName', payload.customerName)
      formData.append('eventDate', payload.eventDate)

      // Use native fetch to avoid axios transforming FormData
      const baseURL = axiosInstance.defaults.baseURL || ''
      const url = `${baseURL}${apiRoutes.audioOrderUpload}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type - let browser set it with boundary
        },
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error: unknown) {
      handleApiError(error, 'Upload voice order')
    }
  }

  return useMutation({
    mutationFn: uploadVoiceOrder,
    onSuccess: () => {
      toast.success('Voice order uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ORDERS_KEY })
    },
  })
}

// ─── Bill ────────────────────────────────────────────────────────────────────

export type BillType = 'CUSTOMER' | 'STAFF' | 'OWNER'

export interface BillCustomerItem {
  productName?: string
  quantity?: number
  unitPrice?: number
  lineTotal?: number
}

export interface BillRawMaterial {
  rawMaterialName?: string
  requiredQuantity?: number
  unit?: string
}

export interface BillCustomer {
  customerId?: number
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  totalPlates?: number
}

export interface BillData {
  orderId?: number
  customer?: BillCustomer | null
  customerItems?: BillCustomerItem[] | null
  rawMaterials?: BillRawMaterial[] | null
  totalAmount?: number | null
  customerItemsTotal?: number | null
  totalRawMaterialCost?: number | null
  totalSubProductCost?: number | null
  profit?: number | null
  [key: string]: unknown
}

export const fetchOrderBill = async (
  orderId: number,
  type: BillType
): Promise<BillData> => {
  const token = authHandler()
  const res = await axiosInstance.get(`${apiRoutes.orders}/${orderId}/bill`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { type },
  })
  return (res.data?.data ?? res.data) as BillData
}

// ─── Audio Download ──────────────────────────────────────────────────────────

export const useFetchOrderAudio = (audioId?: number | null) => {
  const fetchAudio = async (): Promise<Blob> => {
    try {
      if (!audioId) {
        throw new Error('Audio ID is required')
      }

      const token = authHandler()
      const baseURL = axiosInstance.defaults.baseURL || ''
      
      // Use fetch directly to bypass service worker issues
      const response = await fetch(
        `${baseURL}/api/orders/audio/${audioId}/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Audio file not found on server')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error: unknown) {
      console.error('Audio fetch error:', error)
      handleApiError(error, 'Fetch audio')
      throw error
    }
  }

  return useQuery({
    queryKey: ['orderAudio', audioId],
    queryFn: fetchAudio,
    enabled: !!audioId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 1,
  })
}
