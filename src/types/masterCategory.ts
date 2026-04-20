/**
 * Master Category API types
 */
export interface Category {
  id: number
  primaryName: string
  secondaryName: string
  description?: string
  active: boolean
  masterCategoryId: number
  masterCategoryName: string
}

export interface MasterCategory {
  id: number
  primaryName: string
  secondaryName: string
  description: string
  active: boolean
  categories?: Category[]
}

export type MasterCategoryPayload = Omit<MasterCategory, 'id' | 'categories'>
