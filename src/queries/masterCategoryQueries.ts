/**
 * ---------------------------------------
 * Master Category Service Hooks - CRUD Operations
 * ---------------------------------------
 * Endpoints:
 *
 * GET    /api/admin/master-categories
 * GET    /api/admin/master-categories/{id}
 * POST   /api/admin/master-categories/bulk/create
 * PUT    /api/admin/master-categories/bulk/update
 * DELETE /api/admin/master-categories/{id}
 */

import type { DropdownOption } from '@/components/common/Input'
import { apiRoutes } from '@/routes/apiRoutes'
import type { MasterCategory, MasterCategoryPayload } from '@/types/masterCategory'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

/**
 * Query keys
 */
const MASTER_CATEGORIES_KEY = ['masterCategories'] as const
const masterCategoryKey = (id: number | string) => [...MASTER_CATEGORIES_KEY, id] as const

/**
 * 🔍 Fetch all master categories
 */
export const useFetchMasterCategories = () => {
  const fetchAll = async (): Promise<MasterCategory[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(apiRoutes.masterCategories, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return (res.data?.data ?? []) as MasterCategory[]
    } catch (error: unknown) {
      handleApiError(error, 'Master Categories')
    }
  }

  return useQuery({
    queryKey: MASTER_CATEGORIES_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single master category by id
 */
export const useFetchMasterCategoryById = (id?: number) => {
  const fetchById = async (): Promise<MasterCategory> => {
    try {
      if (!id && id !== 0) {
        throw new Error('Master category id is required')
      }

      const token = authHandler()

      const res = await axiosInstance.get(`${apiRoutes.masterCategories}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data as MasterCategory
    } catch (error: unknown) {
      handleApiError(error, 'Master Category')
    }
  }

  return useQuery({
    queryKey: masterCategoryKey(id ?? 'unknown'),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔽 Fetch master category options for dropdowns
 */
export const useFetchMasterCategoryOptions = () => {
  const fetchOptions = async (): Promise<DropdownOption[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.get(apiRoutes.masterCategories, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const masterCategories = res.data.data as MasterCategory[]

      return masterCategories.map((category) => ({
        id: category.id,
        label: category.primaryName,
      }))
    } catch (error: unknown) {
      handleApiError(error, 'Master Categories')
    }
  }

  return useQuery({
    queryKey: ['masterCategoryOptions'],
    queryFn: fetchOptions,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new master category
 */
export const useCreateMasterCategory = () => {
  const queryClient = useQueryClient()

  const createMasterCategory = async (
    payload: MasterCategoryPayload
  ): Promise<MasterCategory> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post(
        apiRoutes.masterCategories,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? res.data) as MasterCategory
    } catch (error: unknown) {
      handleApiError(error, 'Create master category')
      throw error
    }
  }

  return useMutation({
    mutationFn: createMasterCategory,
    onSuccess: () => {
      toast.success('Master category created successfully')
      queryClient.invalidateQueries({ queryKey: MASTER_CATEGORIES_KEY })
      queryClient.invalidateQueries({ queryKey: ['masterCategoryOptions'] })
    },
  })
}

/**
 * ✏️ Edit an existing master category
 */
export const useEditMasterCategory = () => {
  const queryClient = useQueryClient()

  const editMasterCategory = async (payload: MasterCategory): Promise<MasterCategory> => {
    try {
      const token = authHandler()

      const { id, ...updatePayload } = payload

      const res = await axiosInstance.put(
        `${apiRoutes.masterCategories}/${id}`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? res.data) as MasterCategory
    } catch (error: unknown) {
      handleApiError(error, 'Master Category')
      throw error
    }
  }

  return useMutation({
    mutationFn: editMasterCategory,
    onSuccess: () => {
      toast.success('Master category updated successfully')
      queryClient.invalidateQueries({ queryKey: MASTER_CATEGORIES_KEY })
      queryClient.invalidateQueries({ queryKey: ['masterCategoryOptions'] })
    },
  })
}

/**
 * 🗑️ Delete a master category
 */
export const useDeleteMasterCategory = () => {
  const queryClient = useQueryClient()

  const deleteMasterCategory = async (id: number): Promise<boolean> => {
    try {
      const token = authHandler()

      await axiosInstance.delete(`${apiRoutes.masterCategories}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return true
    } catch (error: unknown) {
      handleApiError(error, 'Delete master category')
      return false
    }
  }

  return useMutation({
    mutationFn: deleteMasterCategory,
    onSuccess: () => {
      toast.success('Master category deleted successfully')
      queryClient.invalidateQueries({ queryKey: MASTER_CATEGORIES_KEY })
      queryClient.invalidateQueries({ queryKey: ['masterCategoryOptions'] })
    },
  })
}
