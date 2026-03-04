/**
 * Recipe API types
 */

export type IngredientType = 'RAW_MATERIAL' | 'SUB_PRODUCT'

export interface RecipeProductRef {
  productId: number
  productPrimaryName: string
  productSecondaryName?: string
}

export interface RecipeRawMaterialRef {
  rawMaterialId: number
  rawMaterialPrimaryName: string
  rawMaterialSecondaryName?: string
}

export interface RecipeSubProductRef {
  subProductId: number
  subProductPrimaryName: string
  subProductSecondaryName?: string
}

export interface Recipe {
  id: number
  product: RecipeProductRef
  ingredientType?: IngredientType
  rawMaterial?: RecipeRawMaterialRef
  // nested (legacy)
  subProduct?: RecipeSubProductRef
  // flat fields returned by the current API
  subProductId?: number | null
  subProductName?: string | null
  qtyPerUnit: number
  unit: string
}

export interface RecipeItemPayload {
  ingredientType: IngredientType
  rawMaterialId?: number
  subProductId?: number
  qtyPerUnit: number
  unit: string
}

export interface RecipeBulkUpdatePayload {
  productId: number
  recipeItems: RecipeItemPayload[]
}

export interface RecipeCalculationPayload {
  quantity: number
}

export interface RecipeCalculationRow {
  rawMaterialId: number
  rawMaterialPrimaryName: string
  rawMaterialSecondaryName?: string
  unit: string
  qtyPerUnit: number
  totalQuantity: number
}
