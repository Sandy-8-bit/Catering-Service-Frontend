/**
 * Recipe API types
 */

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

export interface Recipe {
  id: number
  product: RecipeProductRef
  rawMaterial: RecipeRawMaterialRef
  qtyPerUnit: number
  unit: string
}

export interface RecipeItemPayload {
  rawMaterialId: number
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
