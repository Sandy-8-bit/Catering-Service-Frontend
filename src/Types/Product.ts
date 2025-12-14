import type { Category } from './Category'

/**
 * Product API types
 */
export interface Product {
  id: number
  primaryName: string
  secondaryName: string
  description: string
  price: number
  category: Category
  available: boolean
}

export type ProductPayload = Omit<Product, 'id' | 'category'> & {
  categoryId: number
}



export type ProductQueryParams = Record<string, string | number | boolean>
