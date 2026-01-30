/**
 * API types
 */

export interface RawMaterial {
  id: number
  primaryName: string
  secondaryName: string
  purchaseUnit: string
  consumptionUnit: string
  purchasePrice: number
}

export type RawMaterialPayload = Omit<RawMaterial, 'id'>
