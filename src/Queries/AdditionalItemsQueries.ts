/**
 * -------------------------------------------
 * Additional Item Service Hooks - CRUD Operations
 * -------------------------------------------
 * Endpoints (from additional-item-controller):
 *
 * GET    /api/admin/additional-items
 * GET    /api/admin/additional-items/{id}
 * POST   /api/admin/additional-items/bulk/create
 * PUT    /api/admin/additional-items/bulk/update
 * DELETE /api/admin/additional-items/{id}
 */

import type { DropdownOption } from '@/components/common/Input'
import { apiRoutes } from '@/routes/apiRoutes'
import type {
  AdditionalItem,
  AdditionalItemPayload,
} from '@/types/AdditionalItem'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

/**
 * Query keys
 */
const ADDITIONAL_ITEMS_KEY = ['additionalItems'] as const
const additionalItemKey = (id: number | string) =>
  [...ADDITIONAL_ITEMS_KEY, id] as const

/**
 * 🔍 Fetch all additional items
 */
export const useFetchAdditionalItems = () => {
  const fetchAll = async (): Promise<AdditionalItem[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(apiRoutes.additionalItems, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return (res.data?.data ?? []) as AdditionalItem[]
    } catch (error) {
      handleApiError(error, 'Additional items')
    }
  }

  return useQuery({
    queryKey: ADDITIONAL_ITEMS_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single additional item by id
 */
export const useFetchAdditionalItemById = (id: number) => {
  const fetchById = async (): Promise<AdditionalItem> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(
        `${apiRoutes.additionalItems}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data as AdditionalItem
    } catch (error) {
      handleApiError(error, 'Additional item')
    }
  }

  return useQuery({
    queryKey: additionalItemKey(id),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔽 Fetch additional item options for dropdowns
 */
export const useFetchAdditionalItemOptions = () => {
  const fetchOptions = async (): Promise<DropdownOption[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(apiRoutes.additionalItems, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const items = (res.data?.data ?? []) as AdditionalItem[]

      return items.map((item) => ({
        id: item.id,
        label: item.primaryName,
      }))
    } catch (error: unknown) {
      handleApiError(error, 'Additional items options')
    }
  }

  return useQuery({
    queryKey: ['additionalItemOptions'],
    queryFn: fetchOptions,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new additional item
 */
export const useCreateAdditionalItem = () => {
  const queryClient = useQueryClient()

  const createAdditionalItem = async (
    payloads: AdditionalItemPayload[]
  ): Promise<AdditionalItem[]> => {
    try {
      const token = authHandler()

      if (!payloads.length) {
        return []
      }

      const res = await axiosInstance.post(
        `${apiRoutes.additionalItems}/bulk/create`,
        payloads,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? []) as AdditionalItem[]
    } catch (error) {
      handleApiError(error, 'Create additional item')
    }
  }

  return useMutation({
    mutationFn: createAdditionalItem,
    onSuccess: () => {
      toast.success('Additional item created successfully')
      queryClient.invalidateQueries({ queryKey: ADDITIONAL_ITEMS_KEY })
      queryClient.invalidateQueries({ queryKey: ['additionalItemOptions'] })
    },
  })
}

/**
 * ✏️ Edit an existing additional item
 */
export const useEditAdditionalItem = () => {
  const queryClient = useQueryClient()

  const editAdditionalItem = async (
    additionalItems: AdditionalItem[]
  ): Promise<AdditionalItem[]> => {
    try {
      const token = authHandler()

      if (!additionalItems.length) {
        return []
      }

      const updatePayload = additionalItems.map((item) => {
        const { id, ...payload } = item
        return {
          id,
          request: payload,
        }
      })

      const res = await axiosInstance.put(
        `${apiRoutes.additionalItems}/bulk/update`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? []) as AdditionalItem[]
    } catch (error) {
      handleApiError(error, 'Additional item')
    }
  }

  return useMutation({
    mutationFn: editAdditionalItem,
    onSuccess: (_data, variables) => {
      toast.success('Additional item updated successfully')
      queryClient.invalidateQueries({ queryKey: ADDITIONAL_ITEMS_KEY })
      variables?.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: additionalItemKey(item.id),
        })
      })
      queryClient.invalidateQueries({ queryKey: ['additionalItemOptions'] })
    },
  })
}

/**
 * ❌ Delete an additional item
 */
export const useDeleteAdditionalItem = () => {
  const queryClient = useQueryClient()

  const deleteAdditionalItem = async (additionalItem: AdditionalItem) => {
    try {
      const token = authHandler()

      const res = await axiosInstance.delete(
        `${apiRoutes.additionalItems}/${additionalItem.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data
    } catch (error) {
      handleApiError(error, 'Additional item')
    }
  }

  return useMutation({
    mutationFn: deleteAdditionalItem,
    onSuccess: () => {
      toast.success('Additional item deleted successfully')
      queryClient.invalidateQueries({ queryKey: ADDITIONAL_ITEMS_KEY })
      queryClient.invalidateQueries({ queryKey: ['additionalItemOptions'] })
    },
  })
}
