/**
 * API types
 */

export interface RawMaterial {
  id: number
  primaryName: string
  secondaryName: string
  purchaseUnit: string
  purchaseQuantity: string
  purchasePrice: number
}

export type RawMaterialPayload = Omit<RawMaterial, 'id'>
