/**
 * Calculate Raw Materials Queries
 * Endpoints:
 * POST /api/admin/recipes/calculate-order-materials
 */

import { apiRoutes } from '@/routes/apiRoutes'
import type {
  CalculateRawMaterialsRequest,
  CalculateRawMaterialsResponse,
} from '@/types/calculateRawMaterials'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useMutation } from '@tanstack/react-query'

/**
 * Calculate raw materials required for given products and quantities
 */
export const useCalculateRawMaterials = () => {
  const calculateMaterials = async (
    items: CalculateRawMaterialsRequest[]
  ): Promise<CalculateRawMaterialsResponse[]> => {
    try {
      const token = authHandler()

      const res = await axiosInstance.post(
        `${apiRoutes.recipes}/calculate-order-materials`,
        items,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? []) as CalculateRawMaterialsResponse[]
    } catch (error: unknown) {
      handleApiError(error, 'Calculate Raw Materials')
      throw error
    }
  }

  return useMutation({
    mutationFn: calculateMaterials,
  })
}
