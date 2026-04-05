/**
 * API types
 */

export interface RawMaterial {
  id: number
  primaryName: string
  secondaryName: string
  purchaseUnit: string
  purchaseQuantity: string
  purchasePricePerUnit: number
}

export type RawMaterialPayload = Omit<RawMaterial, 'id'>
