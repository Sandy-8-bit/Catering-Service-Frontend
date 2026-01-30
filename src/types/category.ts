/**
 * Category API types
 */
export interface Category {
  id: number
  primaryName: string
  secondaryName: string
}

export type CategoryPayload = Omit<Category, 'id'>
