/**
 * ---------------------------------------
 * Category Service Hooks - CRUD Operations
 * ---------------------------------------
 * Endpoints (from category-controller):
 *
 * GET    /api/admin/categories
 * GET    /api/admin/categories/{id}
 * POST   /api/admin/categories
 * PUT    /api/admin/categories/{id}
 * DELETE /api/admin/categories/{id}
 */

import type { DropdownOption } from '@/components/common/Input'
import { apiRoutes } from '@/routes/apiRoutes'
import type { Category, CategoryPayload } from '@/types/Category'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

/**
 * Query keys
 */
const CATEGORIES_KEY = ['categories'] as const
const categoryKey = (id: number | string) => [...CATEGORIES_KEY, id] as const

/**
 * 🔍 Fetch all categories
 */
export const useFetchCategories = () => {
  const fetchAll = async (): Promise<Category[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.categories, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // backend returns: { data: Category[] }
      return (res.data?.data ?? []) as Category[]
    } catch (error: unknown) {
      handleApiError(error, 'Categories')
    }
  }

  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single category by id
 */
export const useFetchCategoryById = (id?: number) => {
  const fetchById = async (): Promise<Category> => {
    try {
      if (!id && id !== 0) {
        throw new Error('Category id is required')
      }

      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(`${apiRoutes.categories}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data as Category
    } catch (error: unknown) {
      handleApiError(error, 'Category')
    }
  }

  return useQuery({
    queryKey: categoryKey(id ?? 'unknown'),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔽 Fetch category options for dropdowns
 */
export const useFetchCategoryOptions = () => {
  const fetchOptions = async (): Promise<DropdownOption[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.categories, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const categories = res.data.data as Category[]

      return categories.map((category) => ({
        id: category.id,
        label: category.primaryName,
      }))
    } catch (error: unknown) {
      handleApiError(error, 'Categories')
    }
  }

  return useQuery({
    queryKey: ['categoryOptions'],
    queryFn: fetchOptions,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  const createCategory = async (payload: CategoryPayload) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.post(apiRoutes.categories, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data.data as Category
    } catch (error: unknown) {
      handleApiError(error, 'Create category')
    }
  }

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success('Category created successfully')
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      queryClient.invalidateQueries({ queryKey: ['categoryOptions'] })
    },
  })
}

/**
 * ✏️ Edit an existing category
 */
export const useEditCategory = () => {
  const queryClient = useQueryClient()

  const editCategory = async (category: Category) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const { id, ...payload } = category

      const res = await axiosInstance.put(
        `${apiRoutes.categories}/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data.data as Category
    } catch (error: unknown) {
      handleApiError(error, 'Category')
    }
  }

  return useMutation({
    mutationFn: editCategory,
    onSuccess: (_data, variables) => {
      toast.success('Category updated successfully')
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      queryClient.invalidateQueries({
        queryKey: categoryKey(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: ['categoryOptions'] })
    },
  })
}

/**
 * ❌ Delete a category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  const deleteCategory = async (category: Category) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.delete(
        `${apiRoutes.categories}/${category.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data
    } catch (error) {
      handleApiError(error, 'Category')
    }
  }

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted successfully')
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
      queryClient.invalidateQueries({ queryKey: ['categoryOptions'] })
    },
  })
}
