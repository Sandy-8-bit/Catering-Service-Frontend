import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import { ArrowLeft, Edit3, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import TableDropDown from '@/components/common/TableDropDown'
import { TableInput } from '@/components/common/TableInput'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchProductById, useFetchProducts } from '@/queries/productQueries'
import { useFetchRawMaterials } from '@/queries/rawMaterialsQueries'
import {
  useFetchRecipeByProduct,
  useUpdateRecipeForProduct,
} from '@/queries/recipeQueries'
import type { RawMaterial } from '@/types/rawMaterial'
import type { IngredientType, Recipe, RecipeItemPayload } from '@/types/recipe'

// ─── Row shapes ───────────────────────────────────────────────────────────────

interface RecipeRow {
  localId: number
  id?: number
  ingredientType: IngredientType
  // RAW_MATERIAL fields
  rawMaterialId: number
  rawMaterialPrimaryName: string
  unitPrice: number
  // SUB_PRODUCT fields
  subProductId: number
  subProductPrimaryName: string
  // Shared
  qtyPerUnit: number
  unit: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let tempRowCounter = 0
const nextTempId = () => {
  tempRowCounter += 1
  return -tempRowCounter
}

const createEmptyRow = (ingredientType: IngredientType): RecipeRow => ({
  localId: nextTempId(),
  ingredientType,
  rawMaterialId: 0,
  rawMaterialPrimaryName: '',
  unitPrice: 0,
  subProductId: 0,
  subProductPrimaryName: '',
  qtyPerUnit: 0,
  unit: ingredientType === 'SUB_PRODUCT' ? 'portion' : '',
})

const isDraftRow = (row: RecipeRow) => row.localId < 0

const isRowEmpty = (row: RecipeRow) => {
  if (row.ingredientType === 'RAW_MATERIAL') {
    return !row.rawMaterialId && !row.qtyPerUnit && !row.unit.trim()
  }
  return !row.subProductId && !row.qtyPerUnit
}

const isRowValid = (row: RecipeRow) => {
  if (row.ingredientType === 'RAW_MATERIAL') {
    return (
      Boolean(row.rawMaterialId) &&
      row.qtyPerUnit > 0 &&
      Boolean(row.unit.trim())
    )
  }
  return (
    Boolean(row.subProductId) && row.qtyPerUnit > 0 && Boolean(row.unit.trim())
  )
}

const normalizeRows = (rows: RecipeRow[]): RecipeItemPayload[] =>
  rows
    .filter(isRowValid)
    .map((row): RecipeItemPayload => {
      if (row.ingredientType === 'RAW_MATERIAL') {
        return {
          ingredientType: 'RAW_MATERIAL',
          rawMaterialId: row.rawMaterialId,
          qtyPerUnit: row.qtyPerUnit,
          unit: row.unit.trim().toLowerCase(),
        }
      }
      return {
        ingredientType: 'SUB_PRODUCT',
        subProductId: row.subProductId,
        qtyPerUnit: row.qtyPerUnit,
        unit: row.unit.trim().toLowerCase(),
      }
    })
    .sort((a, b) => {
      if (a.ingredientType !== b.ingredientType)
        return a.ingredientType === 'RAW_MATERIAL' ? -1 : 1
      const aId =
        a.ingredientType === 'RAW_MATERIAL'
          ? (a.rawMaterialId ?? 0)
          : (a.subProductId ?? 0)
      const bId =
        b.ingredientType === 'RAW_MATERIAL'
          ? (b.rawMaterialId ?? 0)
          : (b.subProductId ?? 0)
      return aId - bId
    })

const ensureDraftRowForType = (
  rows: RecipeRow[],
  type: IngredientType
): RecipeRow[] => {
  const hasBlankDraft = rows.some(
    (r) => r.ingredientType === type && isDraftRow(r) && isRowEmpty(r)
  )
  return hasBlankDraft ? rows : [...rows, createEmptyRow(type)]
}

const ensureDraftRows = (rows: RecipeRow[]): RecipeRow[] =>
  ensureDraftRowForType(
    ensureDraftRowForType(rows, 'RAW_MATERIAL'),
    'SUB_PRODUCT'
  )

const mapRecipeToRow = (
  recipe: Recipe,
  materialMap: Map<number, RawMaterial>
): RecipeRow => {
  const type: IngredientType = recipe.ingredientType ?? 'RAW_MATERIAL'
  const material = materialMap.get(recipe.rawMaterial?.rawMaterialId ?? -1)

  return {
    localId: typeof recipe.id === 'number' ? recipe.id : nextTempId(),
    id: recipe.id,
    ingredientType: type,
    rawMaterialId: recipe.rawMaterial?.rawMaterialId ?? 0,
    rawMaterialPrimaryName: recipe.rawMaterial?.rawMaterialPrimaryName ?? '',
    unitPrice: material?.purchasePrice ?? 0,
    // support both flat API shape { subProductId, subProductName } and nested { subProduct: { subProductId, subProductPrimaryName } }
    subProductId: recipe.subProductId ?? recipe.subProduct?.subProductId ?? 0,
    subProductPrimaryName:
      recipe.subProductName ?? recipe.subProduct?.subProductPrimaryName ?? '',
    qtyPerUnit:
      type === 'RAW_MATERIAL'
        ? (recipe.rawMaterial?.qtyPerUnit ?? recipe.qtyPerUnit ?? 0)
        : (recipe.subProduct?.qtyPerUnit ?? recipe.qtyPerUnit ?? 0),
    unit:
      type === 'RAW_MATERIAL'
        ? (material?.purchaseUnit ??
          recipe.rawMaterial?.unit ??
          recipe.unit ??
          '')
        : (recipe.subProduct?.unit ?? recipe.unit ?? ''),
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const RecipeDetailsPage = () => {
  const navigate = useNavigate()
  const { productId: productIdParam } = useParams<{ productId: string }>()
  const productId = Number(productIdParam)
  const isProductIdValid = Number.isFinite(productId)

  const { data: product, isLoading: isProductLoading } = useFetchProductById(
    isProductIdValid ? productId : undefined
  )
  const { data: rawMaterials = [], isLoading: isRawMaterialsLoading } =
    useFetchRawMaterials()
  const { data: allProducts = [], isLoading: isProductsLoading } =
    useFetchProducts()
  const {
    data: recipeRows = [],
    isLoading: isRecipeLoading,
    isFetching: isRecipeFetching,
  } = useFetchRecipeByProduct(isProductIdValid ? productId : undefined)

  const { mutateAsync: updateRecipe, isPending: isUpdatePending } =
    useUpdateRecipeForProduct()

  const [editData, setEditData] = useState<RecipeRow[]>([])
  const [isEditMode, setIsEditMode] = useState(false)

  const rawMaterialMap = useMemo(
    () => new Map(rawMaterials.map((item) => [item.id, item])),
    [rawMaterials]
  )

  const rawMaterialOptions = useMemo(
    () => rawMaterials.map((m) => ({ id: m.id, label: m.primaryName })),
    [rawMaterials]
  )

  // Products available as sub-products — cannot be sub-product of itself
  const subProductOptions = useMemo(
    () =>
      allProducts
        .filter((p) => p.id !== productId)
        .map((p) => ({ id: p.id, label: p.primaryName })),
    [allProducts, productId]
  )

  useEffect(() => {
    const mapped = recipeRows.map((row) => mapRecipeToRow(row, rawMaterialMap))
    setEditData(ensureDraftRows(mapped))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeRows])

  useEffect(() => {
    if (!rawMaterials.length) return
    setEditData((prev) =>
      prev.map((row) => {
        if (row.ingredientType !== 'RAW_MATERIAL' || !row.rawMaterialId)
          return row
        const material = rawMaterialMap.get(row.rawMaterialId)
        if (!material) return row
        return {
          ...row,
          unit: material.purchaseUnit ?? row.unit,
          unitPrice: material.purchasePrice ?? row.unitPrice,
        }
      })
    )
  }, [rawMaterials, rawMaterialMap])

  const normalizedServerRows = useMemo(
    () =>
      normalizeRows(
        recipeRows.map((row) => mapRecipeToRow(row, rawMaterialMap))
      ),
    [recipeRows, rawMaterialMap]
  )

  const normalizedDraftRows = useMemo(() => normalizeRows(editData), [editData])

  const hasChanges = useMemo(() => {
    const hasAnyFilled = editData.some((row) => !isRowEmpty(row))
    if (!recipeRows.length && !hasAnyFilled) return false
    return !isEqual(normalizedServerRows, normalizedDraftRows)
  }, [normalizedServerRows, normalizedDraftRows, recipeRows, editData])

  const hasInvalidRows = editData.some(
    (row) => !isRowEmpty(row) && !isRowValid(row)
  )

  const updateRow = (localId: number, patch: Partial<RecipeRow>) => {
    setEditData((prev) => {
      let needsDraft: IngredientType | null = null
      const next = prev.map((row) => {
        if (row.localId !== localId) return row
        const wasEmpty = isDraftRow(row) && isRowEmpty(row)
        const updated = { ...row, ...patch }
        if (wasEmpty && !isRowEmpty(updated))
          needsDraft = updated.ingredientType
        return updated
      })
      return needsDraft ? ensureDraftRowForType(next, needsDraft) : next
    })
  }

  const handleRemoveRow = (localId: number) => {
    setEditData((prev) => {
      const removed = prev.find((r) => r.localId === localId)
      const filtered = prev.filter((r) => r.localId !== localId)
      return removed
        ? ensureDraftRowForType(filtered, removed.ingredientType)
        : filtered
    })
  }

  const handleSaveChanges = async () => {
    if (!isProductIdValid) {
      toast.error('Invalid product')
      return
    }
    if (hasInvalidRows) {
      toast.error('Complete every row before saving')
      return
    }
    const validRows = normalizeRows(editData)
    if (!validRows.length) {
      toast.error('Add at least one recipe item')
      return
    }
    try {
      await updateRecipe({ productId, recipeItems: validRows })
      setIsEditMode(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscard = () => {
    setEditData(
      ensureDraftRows(
        recipeRows.map((row) => mapRecipeToRow(row, rawMaterialMap))
      )
    )
    setIsEditMode(false)
  }

  // ─── Column definitions ────────────────────────────────────────────────────

  const rawMaterialColumns: DataCell[] = [
    {
      headingTitle: 'Raw Material',
      className: 'min-w-[240px]',
      render: (_, row: RecipeRow) => {
        const usedIds = new Set(
          editData
            .filter(
              (r) =>
                r.ingredientType === 'RAW_MATERIAL' &&
                r.localId !== row.localId &&
                r.rawMaterialId !== 0
            )
            .map((r) => r.rawMaterialId)
        )
        const options = rawMaterialOptions.filter(
          (o) => !usedIds.has(Number(o.id))
        )
        const selected = rawMaterialOptions.find(
          (o) => o.id === row.rawMaterialId
        ) ?? { id: row.rawMaterialId, label: row.rawMaterialPrimaryName }

        return (
          <div className="relative">
            <TableDropDown
              title=""
              options={options}
              selected={selected.id ? selected : null}
              placeholder="Select raw material"
              isEditMode={isEditMode}
              onChange={(option) => {
                const material = rawMaterialMap.get(Number(option.id))
                updateRow(row.localId, {
                  rawMaterialId: Number(option.id),
                  rawMaterialPrimaryName: option.label,
                  unit: material?.purchaseUnit ?? '',
                  unitPrice: material?.purchasePrice ?? 0,
                })
              }}
            />
            {isEditMode && isDraftRow(row) && !isRowEmpty(row) && (
              <button
                type="button"
                onClick={() => handleRemoveRow(row.localId)}
                className="absolute top-1/2 -left-6 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                aria-label="Remove row"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
    {
      headingTitle: 'Unit Price (₹)',
      className: 'min-w-[120px] text-right',
      render: (_, row: RecipeRow) => (
        <span className="text-sm font-semibold text-zinc-800">
          {row.unitPrice > 0 ? row.unitPrice.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      headingTitle: 'Qty / Unit',
      className: 'min-w-[140px]',
      render: (_, row: RecipeRow) => (
        <TableInput
          title=""
          type="num"
          inputValue={row.qtyPerUnit === 0 ? '' : String(row.qtyPerUnit)}
          isEditMode={isEditMode}
          onChange={(val) =>
            updateRow(row.localId, {
              qtyPerUnit: val === '' ? 0 : Number(val),
            })
          }
        />
      ),
    },
    {
      headingTitle: 'Unit',
      className: 'min-w-[120px]',
      render: (_, row: RecipeRow) => (
        <span className="text-sm font-medium text-zinc-700">
          {row.unit || '—'}
        </span>
      ),
    },
    {
      headingTitle: 'Total Cost (₹)',
      className: 'min-w-[120px] text-right',
      render: (_, row: RecipeRow) => {
        const total = row.unitPrice * row.qtyPerUnit
        return (
          <span className="text-sm font-semibold text-zinc-800">
            {total > 0 ? total.toFixed(2) : '—'}
          </span>
        )
      },
    },
    {
      headingTitle: 'Actions',
      className: 'w-24 text-center',
      render: (_, row: RecipeRow) =>
        isEditMode ? (
          <button
            type="button"
            onClick={() => handleRemoveRow(row.localId)}
            className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
          >
            Remove
          </button>
        ) : null,
    },
  ]

  const subProductColumns: DataCell[] = [
    {
      headingTitle: 'Sub Product',
      className: 'min-w-[240px]',
      render: (_, row: RecipeRow) => {
        const usedIds = new Set(
          editData
            .filter(
              (r) =>
                r.ingredientType === 'SUB_PRODUCT' &&
                r.localId !== row.localId &&
                r.subProductId !== 0
            )
            .map((r) => r.subProductId)
        )
        const options = subProductOptions.filter(
          (o) => !usedIds.has(Number(o.id))
        )
        const selected = subProductOptions.find(
          (o) => o.id === row.subProductId
        ) ?? { id: row.subProductId, label: row.subProductPrimaryName }

        return (
          <div className="relative">
            <TableDropDown
              title=""
              options={options}
              selected={selected.id ? selected : null}
              placeholder="Select sub product"
              isEditMode={isEditMode}
              onChange={(option) => {
                updateRow(row.localId, {
                  subProductId: Number(option.id),
                  subProductPrimaryName: option.label,
                })
              }}
            />
            {isEditMode && isDraftRow(row) && !isRowEmpty(row) && (
              <button
                type="button"
                onClick={() => handleRemoveRow(row.localId)}
                className="absolute top-1/2 -left-6 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                aria-label="Remove row"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
    {
      headingTitle: 'Qty / Unit',
      className: 'min-w-[140px]',
      render: (_, row: RecipeRow) => (
        <TableInput
          title=""
          type="num"
          inputValue={row.qtyPerUnit === 0 ? '' : String(row.qtyPerUnit)}
          isEditMode={isEditMode}
          onChange={(val) =>
            updateRow(row.localId, {
              qtyPerUnit: val === '' ? 0 : Number(val),
            })
          }
        />
      ),
    },
    {
      headingTitle: 'Unit',
      className: 'min-w-[120px]',
      render: (_, row: RecipeRow) => (
        <span className="text-sm font-medium text-zinc-700">
          {row.unit || 'portion'} qt
        </span>
      ),
    },
    {
      headingTitle: 'Actions',
      className: 'w-24 text-center',
      render: (_, row: RecipeRow) =>
        isEditMode ? (
          <button
            type="button"
            onClick={() => handleRemoveRow(row.localId)}
            className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
          >
            Remove
          </button>
        ) : null,
    },
  ]

  // ─── Derived table data ────────────────────────────────────────────────────

  const rawMaterialRows = editData.filter(
    (r) => r.ingredientType === 'RAW_MATERIAL'
  )
  const subProductRows = editData.filter(
    (r) => r.ingredientType === 'SUB_PRODUCT'
  )

  const visibleRawMaterialRows = isEditMode
    ? rawMaterialRows
    : rawMaterialRows.filter((r) => !isRowEmpty(r))

  const visibleSubProductRows = isEditMode
    ? subProductRows
    : subProductRows.filter((r) => !isRowEmpty(r))

  const isPageLoading =
    !isProductIdValid ||
    isProductLoading ||
    isRawMaterialsLoading ||
    isProductsLoading ||
    isRecipeLoading

  if (!isProductIdValid) {
    return (
      <main className="layout-container flex min-h-[95vh] items-center justify-center rounded-[12px] border-2 border-[#F1F1F1] bg-white">
        <div className="space-y-4 text-center">
          <p className="text-lg font-semibold text-zinc-700">
            Invalid recipe URL
          </p>
          <ButtonSm
            state="default"
            onClick={() => navigate(appRoutes.recipes.path)}
          >
            Back to Recipes
          </ButtonSm>
        </div>
      </main>
    )
  }

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <ArrowLeft
            size={24}
            className="cursor-pointer text-zinc-600 transition hover:scale-105"
            onClick={() => navigate(-1)}
          />
          <div>
            {product?.category?.primaryName && (
              <p className="text-xs text-zinc-500">
                {product.category.primaryName}
              </p>
            )}
            <h1 className="text-xl font-semibold text-zinc-800">
              {product?.primaryName ||
                (isProductLoading ? 'Loading...' : product?.primaryName)}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {isEditMode ? (
            <>
              <ButtonSm
                state="outline"
                onClick={handleDiscard}
                disabled={isUpdatePending}
              >
                Discard Changes
              </ButtonSm>
              <ButtonSm
                state="default"
                onClick={handleSaveChanges}
                disabled={!hasChanges || hasInvalidRows || isUpdatePending}
                isPending={isUpdatePending}
              >
                Save Recipe
              </ButtonSm>
            </>
          ) : (
            <ButtonSm
              state="default"
              onClick={() => setIsEditMode(true)}
              disabled={isPageLoading}
            >
              <Edit3 className="mr-2 h-4 w-4" /> Edit Recipe
            </ButtonSm>
          )}
        </div>
      </header>

      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-8 p-6">
        {/* ── Raw Materials table ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-bold tracking-wide text-zinc-700 uppercase">
              Raw Materials
            </h2>
          </div>
          <GenericTable
            data={visibleRawMaterialRows}
            dataCell={rawMaterialColumns}
            isLoading={isRecipeLoading || isRecipeFetching || isPageLoading}
            rowKey={(row: RecipeRow) => row.localId}
            className="overflow-hidden rounded-[12px] border border-[#F1F1F1]"
            messageWhenNoData={
              isEditMode
                ? 'Use the blank row below to add raw materials.'
                : 'No raw materials added yet.'
            }
          />
        </div>

        {/* ── Sub Products table ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-0.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold tracking-wide text-zinc-700 uppercase">
              Sub Products
            </h2>
          </div>
          <GenericTable
            data={visibleSubProductRows}
            dataCell={subProductColumns}
            isLoading={isRecipeLoading || isRecipeFetching || isPageLoading}
            rowKey={(row: RecipeRow) => row.localId}
            className="overflow-hidden rounded-[12px] border border-[#F1F1F1]"
            messageWhenNoData={
              isEditMode
                ? 'Use the blank row below to add sub products.'
                : 'No sub products added yet.'
            }
          />
        </div>
      </section>
    </main>
  )
}

export default RecipeDetailsPage
