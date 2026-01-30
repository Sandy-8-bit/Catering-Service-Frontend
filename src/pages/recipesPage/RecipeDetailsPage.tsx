import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import isEqual from 'lodash/isEqual'
import { ArrowLeft, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import TableDropDown from '@/components/common/TableDropDown'
import { TableInput } from '@/components/common/TableInput'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchProductById } from '@/queries/productQueries'
import { useFetchRawMaterials } from '@/queries/rawMaterialsQueries'
import {
  useFetchRecipeByProduct,
  useUpdateRecipeForProduct,
} from '@/queries/recipeQueries'
import type { RawMaterial } from '@/types/rawMaterial'
import type { Recipe } from '@/types/recipe'

interface RecipeRow {
  localId: number
  id?: number
  rawMaterialId?: number
  rawMaterialPrimaryName: string
  qtyPerUnit: string | number
  unit: string
  unitPrice: number
}

let tempRowCounter = 0
const nextTempId = () => {
  tempRowCounter += 1
  return -tempRowCounter
}

const mapRecipeToRow = (
  recipe: Recipe,
  materialMap: Map<number, RawMaterial>
): RecipeRow => {
  const material = materialMap.get(recipe.rawMaterial?.rawMaterialId ?? -1)

  return {
    localId: typeof recipe.id === 'number' ? recipe.id : nextTempId(),
    id: recipe.id,
    rawMaterialId: recipe.rawMaterial?.rawMaterialId,
    rawMaterialPrimaryName: recipe.rawMaterial?.rawMaterialPrimaryName ?? '',
    qtyPerUnit: recipe.qtyPerUnit ?? 0,
    unit: material?.consumptionUnit ?? recipe.unit ?? '',
    unitPrice: material?.purchasePrice ?? 0,
  }
}

const createEmptyRecipeRow = (): RecipeRow => ({
  localId: nextTempId(),
  rawMaterialPrimaryName: '',
  qtyPerUnit: '',
  unit: '',
  unitPrice: 0,
})

const isDraftRow = (row: RecipeRow) => row.localId < 0

const isRowEmpty = (row: RecipeRow) =>
  ['rawMaterialPrimaryName', 'qtyPerUnit', 'unit', 'unitPrice'].every(
    (field) => {
      const value = row[field as keyof RecipeRow]
      if (typeof value === 'number') {
        return !value
      }
      return (value ?? '').toString().trim().length === 0
    }
  ) && !row.rawMaterialId

const isRowPopulated = (row: RecipeRow) => !isRowEmpty(row)

const isRowValid = (row: RecipeRow) =>
  Boolean(row.rawMaterialId) &&
  Number(row.qtyPerUnit) >= 0 &&
  row.unit.trim().length >= 0

const normalizeRecipeApiRows = (rows: Recipe[]) =>
  rows
    .map((row) => ({
      rawMaterialId: row.rawMaterial?.rawMaterialId ?? 0,
      qtyPerUnit: Number(row.qtyPerUnit) || 0,
      unit: (row.unit ?? '').trim().toLowerCase(),
    }))
    .filter((row) => row.rawMaterialId)
    .sort((a, b) => a.rawMaterialId - b.rawMaterialId)

const normalizeRows = (rows: RecipeRow[]) =>
  rows
    .filter((row) => row.rawMaterialId)
    .map((row) => ({
      rawMaterialId: row.rawMaterialId ?? 0,
      qtyPerUnit: Number(row.qtyPerUnit) || 0,
      unit: row.unit.trim().toLowerCase(),
    }))
    .sort((a, b) => a.rawMaterialId - b.rawMaterialId)

const ensureDraftRow = (rows: RecipeRow[]): RecipeRow[] => {
  const hasBlankDraft = rows.some((row) => isDraftRow(row) && isRowEmpty(row))
  if (hasBlankDraft) return rows
  return [...rows, createEmptyRecipeRow()]
}

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
  const {
    data: recipeRows = [],
    isLoading: isRecipeLoading,
    isFetching: isRecipeFetching,
  } = useFetchRecipeByProduct(isProductIdValid ? productId : undefined)

  const { mutateAsync: updateRecipe, isPending: isUpdatePending } =
    useUpdateRecipeForProduct()
  const [editData, setEditData] = useState<RecipeRow[]>([])

  const rawMaterialMap = useMemo(() => {
    return new Map(rawMaterials.map((item) => [item.id, item]))
  }, [rawMaterials])

  const rawMaterialOptions = useMemo(
    () =>
      rawMaterials.map((material) => ({
        id: material.id,
        label: material.primaryName,
      })),
    [rawMaterials]
  )

  useEffect(() => {
    const mapped = recipeRows.map((row) => mapRecipeToRow(row, rawMaterialMap))
    setEditData(ensureDraftRow(mapped))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeRows])

  useEffect(() => {
    if (!rawMaterials.length) return
    setEditData((prev) =>
      prev.map((row) => {
        if (!row.rawMaterialId) return row
        const material = rawMaterialMap.get(row.rawMaterialId)
        if (!material) return row

        const nextUnit = material.consumptionUnit ?? row.unit
        const nextPrice = material.purchasePrice ?? row.unitPrice

        if (nextUnit === row.unit && nextPrice === row.unitPrice) {
          return row
        }

        return {
          ...row,
          unit: nextUnit,
          unitPrice: nextPrice,
        }
      })
    )
  }, [rawMaterials, rawMaterialMap])

  const normalizedServerRows = useMemo(
    () => normalizeRecipeApiRows(recipeRows),
    [recipeRows]
  )

  const normalizedDraftRows = useMemo(() => normalizeRows(editData), [editData])

  const hasChanges = useMemo(() => {
    if (!recipeRows.length && !editData.some(isRowPopulated)) return false
    return !isEqual(normalizedServerRows, normalizedDraftRows)
  }, [normalizedServerRows, normalizedDraftRows, recipeRows, editData])

  const hasInvalidRows = useMemo(
    () => editData.some((row) => isRowPopulated(row) && !isRowValid(row)),
    [editData]
  )

  const validRows = useMemo(
    () => editData.filter((row) => isRowValid(row)),
    [editData]
  )

  const updateRow = (localId: number, patch: Partial<RecipeRow>) => {
    setEditData((prev) => {
      let needsNewDraft = false
      const next = prev.map((row) => {
        if (row.localId !== localId) return row
        const wasEmptyDraft = isDraftRow(row) && isRowEmpty(row)
        const updated = {
          ...row,
          ...patch,
        }
        if (wasEmptyDraft && !isRowEmpty(updated)) {
          needsNewDraft = true
        }
        return updated
      })

      return needsNewDraft ? ensureDraftRow(next) : next
    })
  }

  const handleRemoveRow = (localId: number) => {
    setEditData((prev) =>
      ensureDraftRow(prev.filter((row) => row.localId !== localId))
    )
  }

  const handleDiscardChanges = () => {
    setEditData(
      ensureDraftRow(
        recipeRows.map((row) => mapRecipeToRow(row, rawMaterialMap))
      )
    )
  }

  const handleSaveChanges = async () => {
    if (!isProductIdValid) {
      toast.error('Invalid product selected')
      return
    }

    if (hasInvalidRows) {
      toast.error('Complete every recipe row before saving')
      return
    }

    if (!validRows.length) {
      toast.error('Add at least one recipe row before saving')
      return
    }

    try {
      await updateRecipe({
        productId,
        items: validRows.map((row) => ({
          rawMaterialId: row.rawMaterialId!,
          qtyPerUnit: Number(row.qtyPerUnit),
          unit: row.unit.trim(),
        })),
      })
    } catch (error) {
      console.error(error)
    }
  }

  const recipeTableColumns: DataCell[] = [
    {
      headingTitle: 'Raw Material',
      className: 'min-w-[240px]',
      render: (_value, row: RecipeRow) => {
        const selectedOption = rawMaterialOptions.find(
          (option) => option.id === row.rawMaterialId
        ) ?? {
          id: row.rawMaterialId ?? 0,
          label: row.rawMaterialPrimaryName ?? '',
        }
        const isDraft = isDraftRow(row)

        return (
          <div className="relative">
            <TableDropDown
              title=""
              options={rawMaterialOptions}
              selected={selectedOption.id ? selectedOption : null}
              placeholder="Select raw material"
              isEditMode
              onChange={(option) => {
                const material = rawMaterialMap.get(Number(option.id))
                updateRow(row.localId, {
                  rawMaterialId: Number(option.id),
                  rawMaterialPrimaryName: option.label,
                  unit: material?.consumptionUnit ?? '',
                  unitPrice: material?.purchasePrice ?? 0,
                })
              }}
            />
            {isDraft && !isRowEmpty(row) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleRemoveRow(row.localId)
                }}
                className="absolute top-1/2 -left-6 flex h-6 w-6 -translate-y-1/2 items-center justify-center"
                aria-label="Remove draft row"
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
      className: 'min-w-[140px] text-right',
      render: (_value, row: RecipeRow) => (
        <span className="text-sm font-semibold text-zinc-800">
          {row.unitPrice ? row.unitPrice.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      headingTitle: 'Qty / Unit',
      className: 'min-w-[140px]',
      render: (_value, row: RecipeRow) => (
        <TableInput
          title=""
          type="num"
          inputValue={row.qtyPerUnit === '' ? '' : row.qtyPerUnit}
          isEditMode
          onChange={(val) =>
            updateRow(row.localId, {
              qtyPerUnit: val === '' ? '' : val,
            })
          }
        />
      ),
    },
    {
      headingTitle: 'Unit',
      className: 'min-w-[140px]',
      render: (_value, row: RecipeRow) => (
        <span className="text-sm font-medium text-zinc-700">
          {row.unit || '—'}
        </span>
      ),
    },
    {
      headingTitle: 'Total Cost (₹)',
      className: 'min-w-[140px] text-right',
      render: (_value, row: RecipeRow) => {
        const total = row.unitPrice * (Number(row.qtyPerUnit) || 0)
        return (
          <span className="text-sm font-semibold text-zinc-800">
            {total > 0 ? total.toFixed(2) : '—'}
          </span>
        )
      },
    },
    {
      headingTitle: 'Actions',
      className: 'w-28 text-center',
      render: (_value, row: RecipeRow) => (
        <button
          type="button"
          onClick={() => handleRemoveRow(row.localId)}
          className="text-sm font-semibold text-rose-500 transition hover:text-rose-600"
        >
          Remove
        </button>
      ),
    },
  ]

  const isPageLoading =
    !isProductIdValid ||
    isProductLoading ||
    isRawMaterialsLoading ||
    isRecipeLoading
  const isTableLoading = isRecipeLoading || isRecipeFetching

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
            <p className="text-xs tracking-wide text-zinc-500 uppercase">
              Recipe Detail
            </p>
            <h1 className="text-xl font-semibold text-zinc-800">
              {product?.primaryName ?? 'Loading product...'}
            </h1>
            {product?.category?.primaryName && (
              <p className="text-sm text-zinc-500">
                {product.category.primaryName}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonSm
            state="outline"
            onClick={handleDiscardChanges}
            disabled={!hasChanges || isUpdatePending}
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
        </div>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-6 p-6">
        <GenericTable
          data={editData}
          dataCell={recipeTableColumns}
          isLoading={isTableLoading || isPageLoading}
          rowKey={(row: RecipeRow) => row.localId}
          className="overflow-hidden rounded-[12px] border border-[#F1F1F1]"
          messageWhenNoData="Start by typing into the blank row to add recipe items."
        />
      </section>
    </main>
  )
}

export default RecipeDetailsPage
