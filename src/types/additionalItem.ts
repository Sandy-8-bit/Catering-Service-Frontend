/**
 * API types for Additional Items
 */

export interface AdditionalItem {
  id: number
  primaryName: string
  secondaryName: string
  description: string
  trackStock: boolean
  availableQty: number
  chargeable: boolean
  pricePerUnit: number
  active: boolean
  returnable: boolean
}

export type AdditionalItemPayload = Omit<AdditionalItem, 'id'>
