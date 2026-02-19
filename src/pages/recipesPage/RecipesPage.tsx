import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'
import DropdownSelect from '@/components/common/DropDown'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import Input from '@/components/common/Input'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchProducts } from '@/queries/productQueries'
import { useCalculateRecipeRequirement } from '@/queries/recipeQueries'
import type { Product } from '@/types/product'
import type { RecipeCalculationRow } from '@/types/recipe'

const RecipesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: products = [], isLoading: isProductsLoading } =
    useFetchProducts()

  const [calculationProductId, setCalculationProductId] = useState<
    number | null
  >(null)
  const [calculationQuantity, setCalculationQuantity] = useState('1')
  const [calculationResult, setCalculationResult] = useState<
    RecipeCalculationRow[] | null
  >(null)

  const { mutateAsync: calculateRequirement, isPending: isCalculatePending } =
    useCalculateRecipeRequirement()

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        label: product.primaryName,
      })),
    [products]
  )

  const selectedProductOption = useMemo(() => {
    if (!calculationProductId) {
      return { id: 0, label: 'Select Product' }
    }
    return (
      productOptions.find((option) => option.id === calculationProductId) ?? {
        id: calculationProductId,
        label: 'Selected Product',
      }
    )
  }, [productOptions, calculationProductId])

  useEffect(() => {
    setCalculationResult(null)
  }, [calculationProductId])

  const navigateToDetail = (productId: number) => {
    const detailPath = appRoutes.recipes.children.detail.replace(
      ':productId',
      String(productId)
    )
    navigate(detailPath)
  }

  const handleCalculateRequirement = async () => {
    if (!calculationProductId) {
      toast.error('Select a product to calculate requirements')
      return
    }

    const quantity = Number(calculationQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter a valid quantity greater than 0')
      return
    }

    try {
      const result = await calculateRequirement({
        productId: calculationProductId,
        quantity,
      })
      setCalculationResult(result ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const recipeTableColumns: DataCell[] = [
    {
      headingTitle: 'Product',
      className: 'min-w-[220px]',
      render: (_value, row: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-900">
            {row.primaryName}
          </span>
          <span className="text-xs text-zinc-500">{row.secondaryName}</span>
        </div>
      ),
    },
    {
      headingTitle: t('product_category'),
      className: 'min-w-[160px]',
      render: (_value, row: Product) => (
        <span className="text-sm font-medium text-zinc-700">
          {row.category?.primaryName ?? '—'}
        </span>
      ),
    },
    {
      headingTitle: t('product_price'),
      className: 'min-w-[120px] text-right',
      render: (_value, row: Product) => (
        <span className="text-sm font-semibold text-zinc-800">
          {row.price?.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}
        </span>
      ),
    },
    {
      headingTitle: t('availability'),
      className: 'min-w-[140px]',
      render: (_value, row: Product) => (
        <span
          className={`text-xs font-semibold uppercase ${row.available ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {row.available ? t('available') : t('unavailable')}
        </span>
      ),
    },
  ]

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">{t('recipes')}</h1>
          <p className="text-sm text-zinc-500">
            {t('review_products')}
          </p>
        </div>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-6 p-6">
        <GenericTable
          data={products}
          dataCell={recipeTableColumns}
          isLoading={isProductsLoading}
          tableTitle="Product Recipes"
          messageWhenNoData="No products available yet."
          rowKey={(row: Product) => row.id}
          onView={(row: Product) => navigateToDetail(row.id)}
          onEdit={(row: Product) => navigateToDetail(row.id)}
          className="overflow-hidden rounded-[12px] border border-[#F1F1F1]"
        />

        <section className="rounded-[12px] border border-[#F1F1F1] bg-white p-5">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-zinc-800">
                Calculate Requirement
              </h3>
              <p className="text-sm text-zinc-500">
                Quickly estimate how much inventory you need for any product.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_minmax(160px,auto)_auto]">
              <DropdownSelect
                title="Product"
                options={productOptions}
                selected={selectedProductOption}
                placeholder="Choose product"
                onChange={(option) =>
                  setCalculationProductId(Number(option.id) || null)
                }
                required
              />
              <Input
                title="Quantity"
                name="quantity"
                inputValue={calculationQuantity}
                placeholder="Eg. 150 plates"
                onChange={(value) => setCalculationQuantity(value)}
              />
              <ButtonSm
                state="default"
                onClick={handleCalculateRequirement}
                isPending={isCalculatePending}
                className="self-end"
              >
                Calculate
              </ButtonSm>
            </div>
          </header>
          <div className="overflow-x-auto">
            {calculationResult && calculationResult.length > 0 ? (
              <table className="min-w-full text-left text-sm text-zinc-700">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs tracking-wide text-zinc-500 uppercase">
                    <th className="py-2 pr-3">{t('raw_material_column')}</th>
                    <th className="py-2 pr-3">{t('unit')}</th>
                    <th className="py-2 pr-3 text-right">{t('qty_per_unit')}</th>
                    <th className="py-2 text-right">{t('total_qty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {calculationResult.map((item) => (
                    <tr
                      key={item.rawMaterialId}
                      className="border-b border-zinc-100"
                    >
                      <td className="py-2 pr-3 font-medium text-zinc-800">
                        {item.rawMaterialPrimaryName}
                      </td>
                      <td className="py-2 pr-3">{item.unit}</td>
                      <td className="py-2 pr-3 text-right">
                        {item.qtyPerUnit.toFixed(2)}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {item.totalQuantity.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-zinc-500">
                {t('calculation_help')}
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default RecipesPage
