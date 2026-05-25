/**
 * Calculate Raw Materials API Types
 */

export interface CalculateRawMaterialsRequest {
  productId: number
  quantity: number
}

export interface CalculateRawMaterialsResponse {
  rawMaterialId: number
  rawMaterialPrimaryName: string
  rawMaterialSecondaryName: string
  unit: string
  qtyPerUnit: null | number
  totalQuantity: number
}

export interface CalculateRawMaterialsApiResponse {
  success: boolean
  data: CalculateRawMaterialsResponse[]
  timestamp: string
}

// ─── New Product-Level Structure ──────────────────────────────────────────────

export interface RawMaterialDetail {
  rawMaterialId: number
  rawMaterialPrimaryName: string
  rawMaterialSecondaryName?: string
  unit: string
  qtyPerUnit: number
  pricePerUnit: number
  totalQuantity: number
  notes: string | null
}

export interface CalculateRawMaterialsProductItem {
  productId: number
  productPrimaryName: string
  orderedQuantity: number
  rawMaterials: RawMaterialDetail[]
  subProducts: RawMaterialDetail[]
}

export interface CalculateRawMaterialsProductResponse {
  success: boolean
  data: CalculateRawMaterialsProductItem[]
  timestamp: string
}
