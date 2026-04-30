/**
 * SubProduct reference in Product
 */
export interface SubProduct {
  subProductId: number
  subProductName: string
  qtyPerUnit: number
  unit: string
}

/**
 * Product API types
 */
export interface Product {
  id: number
  primaryName: string
  secondaryName: string
  description: string
  price: number
  categoryIds: number[]
  available: boolean
  isRecipe: boolean
  productType: 'VEG' | 'NON_VEG'
  subProducts: SubProduct[]
}

export type ProductPayload = {
  primaryName: string
  secondaryName: string
  description: string
  price: number
  categoryIds: number[]
  available: boolean
  isRecipe: boolean
  productType: 'VEG' | 'NON_VEG'
}

export type ProductCreateRequest = {
  request: ProductPayload
}

export type ProductUpdateRequest = {
  id: number
  request: ProductPayload
}

export type ProductQueryParams = Record<string, string | number | boolean>
