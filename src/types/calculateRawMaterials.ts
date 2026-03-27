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
