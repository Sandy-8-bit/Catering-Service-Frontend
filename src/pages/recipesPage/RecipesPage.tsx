  import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchProducts } from '@/queries/productQueries'
import type { Product } from '@/types/product'

const RecipesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: products = [], isLoading: isProductsLoading } =
    useFetchProducts()

  const navigateToDetail = (productId: number) => {
    const detailPath = appRoutes.recipes.children.detail.replace(
      ':productId',
      String(productId)
    )
    navigate(detailPath)
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
          {row.categoryIds?.length ? row.categoryIds.join(', ') : '—'}
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
          <h1 className="text-xl font-semibold text-zinc-800">
            {t('recipes')}
          </h1>
          <p className="text-sm text-zinc-500">{t('review_products')}</p>
        </div>
      </header>

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
      </section>
    </main>
  )
}

export default RecipesPage
