/**
 * Master Category reference in Category
 */
export interface MasterCategoryInCategory {
  masterCategoryId: number
  masterCategoryName: string
}

/**
 * Category API types
 */
export interface Category {
  id: number
  primaryName: string
  secondaryName: string
  active?: boolean | null
  masterCategories?: MasterCategoryInCategory[]
  masterCategoryIds?: number[]
}

export type CategoryPayload = Omit<Category, 'id' | 'masterCategories'>
