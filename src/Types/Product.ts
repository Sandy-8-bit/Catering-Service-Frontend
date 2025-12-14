/**
 * Product API types
 */
export interface Product {
  id: number
  primaryName: string
  secondaryName: string
  description: string
  price: number
  categoryId: number
  available: boolean
}

export type ProductPayload = Omit<Product, 'id'>

export type ProductQueryParams = Record<string, string | number | boolean>
