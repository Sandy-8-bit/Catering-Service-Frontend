/**
 * -------------------------------------------
 * Raw Material Service Hooks - CRUD Operations
 * -------------------------------------------
 * Endpoints (from raw-material-controller):
 *
 * GET    /api/admin/raw-materials
 * GET    /api/admin/raw-materials/{id}
 * POST   /api/admin/raw-materials
 * PUT    /api/admin/raw-materials/{id}
 * DELETE /api/admin/raw-materials/{id}
 */

import type { DropdownOption } from '@/components/common/Input'
import { apiRoutes } from '@/routes/apiRoutes'
import type { RawMaterial, RawMaterialPayload } from '@/types/RawMaterial'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

/**
 * Query keys
 */
const RAW_MATERIALS_KEY = ['rawMaterials'] as const
const rawMaterialKey = (id: number | string) =>
  [...RAW_MATERIALS_KEY, id] as const

/**
 * 🔍 Fetch all raw materials
 */
export const useFetchRawMaterials = () => {
  const fetchAll = async (): Promise<RawMaterial[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.rawMaterials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // backend returns: { data: RawMaterial[] }
      return (res.data?.data ?? res.data ?? []) as RawMaterial[]
    } catch (error: unknown) {
      handleApiError(error, 'Raw materials')
      return []
    }
  }

  return useQuery({
    queryKey: RAW_MATERIALS_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single raw material by id
 */
export const useFetchRawMaterialById = (id?: number) => {
  const fetchById = async (): Promise<RawMaterial> => {
    try {
      if (!id && id !== 0) {
        throw new Error('Raw material id is required')
      }

      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(`${apiRoutes.rawMaterials}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch raw material')
      }

      // adjust to res.data.data if your backend wraps it
      return res.data as RawMaterial
    } catch (error: unknown) {
      handleApiError(error, 'Raw material')
    }
  }

  return useQuery({
    queryKey: rawMaterialKey(id ?? 'unknown'),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔽 Fetch raw material options for dropdowns
 * Uses id and primaryName as label
 */
export const useFetchRawMaterialOptions = () => {
  const fetchOptions = async (): Promise<DropdownOption[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.rawMaterials, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch raw materials')
      }

      const materials = res.data.data as RawMaterial[]

      return materials.map((material) => ({
        id: material.id,
        label: material.primaryName,
      }))
    } catch (error: unknown) {
      handleApiError(error, 'Raw materials')
    }
  }

  return useQuery({
    queryKey: ['rawMaterialOptions'],
    queryFn: fetchOptions,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new raw material
 */
export const useCreateRawMaterial = () => {
  const queryClient = useQueryClient()

  const createRawMaterial = async (payload: RawMaterialPayload) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.post(apiRoutes.rawMaterials, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data.data as RawMaterial
    } catch (error) {
      handleApiError(error, 'Create Raw material')
    }
  }

  return useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      toast.success('Raw material created successfully')
      queryClient.invalidateQueries({ queryKey: RAW_MATERIALS_KEY })
      queryClient.invalidateQueries({ queryKey: ['rawMaterialOptions'] })
    },
  })
}

/**
 * ✏️ Edit an existing raw material
 */
export const useEditRawMaterial = () => {
  const queryClient = useQueryClient()

  const editRawMaterial = async (rawMaterial: RawMaterial) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const { id, ...payload } = rawMaterial

      const res = await axiosInstance.put(
        `${apiRoutes.rawMaterials}/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to update raw material')
      }

      return res.data.data as RawMaterial
    } catch (error: unknown) {
      handleApiError(error, 'Raw material')
    }
  }

  return useMutation({
    mutationFn: editRawMaterial,
    onSuccess: (_data, variables) => {
      toast.success('Raw material updated successfully')
      queryClient.invalidateQueries({ queryKey: RAW_MATERIALS_KEY })
      queryClient.invalidateQueries({
        queryKey: rawMaterialKey(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: ['rawMaterialOptions'] })
    },
  })
}

/**
 * ❌ Delete a raw material
 */
export const useDeleteRawMaterial = () => {
  const queryClient = useQueryClient()

  const deleteRawMaterial = async (rawMaterial: RawMaterial) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.delete(
        `${apiRoutes.rawMaterials}/${rawMaterial.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (res.status !== 204) {
        throw new Error(res.data?.message || 'Failed to delete raw material')
      }

      return res.data.data
    } catch (error: unknown) {
      handleApiError(error, 'Raw material')
    }
  }

  return useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => {
      toast.success('Raw material deleted successfully')
      queryClient.invalidateQueries({ queryKey: RAW_MATERIALS_KEY })
      queryClient.invalidateQueries({ queryKey: ['rawMaterialOptions'] })
    },
  })
}
