/**
 * ---------------------------------------
 * Recipe Service Hooks - CRUD Operations
 * ---------------------------------------
 * Endpoints (from recipe-controller):
 *
 * GET  /api/admin/recipes/product/{productId}
 * PUT  /api/admin/recipes/product/{productId}
 * PUT  /api/admin/recipes/bulk/update
 * POST /api/admin/recipes/product/{productId}/calculate
 */

import { apiRoutes } from '@/routes/apiRoutes'
import type {
  Recipe,
  RecipeItemPayload,
  RecipeBulkUpdatePayload,
  RecipeCalculationRow,
} from '@/types/Recipe'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const RECIPES_KEY = ['recipes'] as const
const recipeKey = (productId?: number) => [...RECIPES_KEY, productId] as const

/**
 * 🔍 Fetch recipe rows for a product
 */
export const useFetchRecipeByProduct = (productId?: number) => {
  const fetchRecipe = async (): Promise<Recipe[]> => {
    try {
      if (typeof productId !== 'number') {
        return []
      }

      const token = authHandler()

      const res = await axiosInstance.get(
        `${apiRoutes.recipes}/product/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      return (res.data?.data ?? []) as Recipe[]
    } catch (error) {
      handleApiError(error, 'Recipe')
      return []
    }
  }

  return useQuery({
    queryKey: recipeKey(productId),
    queryFn: fetchRecipe,
    enabled: typeof productId === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

interface UpdateRecipeArgs {
  productId: number
  items: RecipeItemPayload[]
}

/**
 * ✏️ Update recipe rows for a product
 */
export const useUpdateRecipeForProduct = () => {
  const queryClient = useQueryClient()

  const updateRecipe = async ({
    productId,
    items,
  }: UpdateRecipeArgs): Promise<Recipe[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.put(
        `${apiRoutes.recipes}/product/${productId}`,
        items,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      return (res.data?.data ?? []) as Recipe[]
    } catch (error) {
      handleApiError(error, 'Update recipe')
      throw error
    }
  }

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_data, variables) => {
      toast.success('Recipe saved successfully')
      queryClient.invalidateQueries({
        queryKey: recipeKey(variables.productId),
      })
    },
  })
}

/**
 * 🔁 Bulk update recipes for multiple products
 */
export const useBulkUpdateRecipes = () => {
  const queryClient = useQueryClient()

  const bulkUpdate = async (
    payload: RecipeBulkUpdatePayload[]
  ): Promise<Recipe[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.put(
        `${apiRoutes.recipes}/bulk/update`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      return (res.data?.data ?? []) as Recipe[]
    } catch (error) {
      handleApiError(error, 'Bulk update recipes')
      throw error
    }
  }

  return useMutation({
    mutationFn: bulkUpdate,
    onSuccess: (_data, variables) => {
      toast.success('Recipes updated successfully')
      variables?.forEach((item) => {
        queryClient.invalidateQueries({ queryKey: recipeKey(item.productId) })
      })
    },
  })
}

interface CalculateRecipeArgs {
  productId: number
  quantity: number
}

/**
 * 📐 Calculate raw material requirement for a quantity
 */
export const useCalculateRecipeRequirement = () => {
  const calculate = async ({
    productId,
    quantity,
  }: CalculateRecipeArgs): Promise<RecipeCalculationRow[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post(
        `${apiRoutes.recipes}/product/${productId}/calculate`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      return (res.data?.data ?? []) as RecipeCalculationRow[]
    } catch (error) {
      handleApiError(error, 'Recipe requirement calculation')
      throw error
    }
  }

  return useMutation({
    mutationFn: calculate,
  })
}
