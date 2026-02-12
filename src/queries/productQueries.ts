/**
 * ---------------------------------------
 * Product Service Hooks - CRUD Operations
 * ---------------------------------------
 * Endpoints (from product-controller):
 *
 * GET    /api/admin/products
 * GET    /api/admin/products/{id}
 * POST   /api/admin/products/bulk/create
 * PUT    /api/admin/products/bulk/update
 * DELETE /api/admin/products/{id}
 */

import { apiRoutes } from '@/routes/apiRoutes'
import type {
  Product,
  ProductPayload,
  ProductQueryParams,
} from '@/types/product'
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
export const useFetchProductById = (id?: number) => {
  const fetchById = async (): Promise<Product> => {
    try {
      if (typeof id !== 'number' || Number.isNaN(id)) {
        throw new Error('Product id is required')
      }

      const token = authHandler()

      const res = await axiosInstance.get(`${apiRoutes.products}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return (res.data?.data ?? {}) as Product
    } catch (error: unknown) {
      handleApiError(error, 'Product')
    }
  }

  return useQuery({
    queryKey: productKey(id ?? 'detail'),
    queryFn: fetchById,
    enabled: typeof id === 'number' && Number.isFinite(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  const createProduct = async (
    payloads: ProductPayload[]
  ): Promise<Product[]> => {
    try {
      const token = authHandler()

      if (!payloads.length) {
        return []
      }

      const res = await axiosInstance.post(
        `${apiRoutes.products}/bulk/create`,
        payloads,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? []) as Product[]
    } catch (error) {
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

  const editProduct = async (products: Product[]): Promise<Product[]> => {
    try {
      const token = authHandler()

      if (!products.length) {
        return []
      }

      const updatePayload = products.map((product) => {
        const { id, category, ...rest } = product

        return {
          id,
          request: {
            categoryId: category.id,
            ...rest,
          },
        }
      })

      const res = await axiosInstance.put(
        `${apiRoutes.products}/bulk/update`,
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return (res.data?.data ?? []) as Product[]
    } catch (error: unknown) {
      handleApiError(error, 'Edit Product')
    }
  }

  return useMutation({
    mutationFn: editProduct,
    onSuccess: (_data, variables) => {
      toast.success('Product updated successfully')
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
      variables?.forEach((item) => {
        queryClient.invalidateQueries({ queryKey: productKey(item.id) })
      })
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
      handleApiError(error, 'Delete Product')
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
