/**
 * ---------------------------------------
 * Product Service Hooks - CRUD Operations
 * ---------------------------------------
 * Endpoints (from product-controller):
 *
 * GET    /api/admin/products
 * GET    /api/admin/products/{id}
 * POST   /api/admin/products
 * PUT    /api/admin/products/{id}
 * DELETE /api/admin/products/{id}
 */

import { apiRoutes } from '@/routes/apiRoutes'
import type {
  Product,
  ProductPayload,
  ProductQueryParams,
} from '@/types/Product'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

/**
 * Query keys
 */
const PRODUCTS_KEY = ['products'] as const
const productKey = (id: number | string) => [...PRODUCTS_KEY, id] as const

/**
 * 🔍 Fetch all products
 */
export const useFetchProducts = (params?: ProductQueryParams) => {
  const fetchAll = async (): Promise<Product[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.products, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })

      return (res.data?.data ?? []) as Product[]
    } catch (error: unknown) {
      handleApiError(error, 'Products')
    }
  }

  return useQuery({
    queryKey: params ? [...PRODUCTS_KEY, params] : PRODUCTS_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single product by id
 */
export const useFetchProductById = (id: number) => {
  const fetchById = async (): Promise<Product> => {
    try {
      if (!id && id !== 0) {
        throw new Error('Product id is required')
      }

      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(`${apiRoutes.products}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data as Product
    } catch (error: unknown) {
      handleApiError(error, 'Product')
    }
  }

  return useQuery({
    queryKey: productKey(id),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  const createProduct = async (payload: ProductPayload) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.post(apiRoutes.products, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data?.data as Product
    } catch (error: unknown) {
      handleApiError(error, 'Create product')
    }
  }

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success('Product created successfully')
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

/**
 * ✏️ Edit an existing product
 */
export const useEditProduct = () => {
  const queryClient = useQueryClient()

  const editProduct = async (product: Product) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const { id, ...payload } = product

      const res = await axiosInstance.put(
        `${apiRoutes.products}/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data as Product
    } catch (error: unknown) {
      handleApiError(error, 'Product')
    }
  }

  return useMutation({
    mutationFn: editProduct,
    onSuccess: (_data, variables) => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      queryClient.invalidateQueries({ queryKey: productKey(variables.id) })
    },
  })
}

/**
 * ❌ Delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  const deleteProduct = async (product: Product) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.delete(
        `${apiRoutes.products}/${product.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data
    } catch (error: unknown) {
      handleApiError(error, 'Product')
    }
  }

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Product deleted successfully')
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}
