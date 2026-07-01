import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from '@/components/common/Spinner'
import { useFetchProducts } from '@/queries/productQueries'
import type { OrderItem, OrderProductRef } from '@/types/order'
import type { Product } from '@/types/product'
import { Minus, Plus } from 'lucide-react'
import ButtonSm from '../common/Buttons'

interface ProductMenuSelectorProps {
  selectedItems: OrderItem[]
  onChange: (items: OrderItem[]) => void
  totalPlates?: number
}

interface MasterCategoryGroup {
  masterCategoryId: number
  masterCategoryName: string
  categoryGroups: {
    categoryId: number
    categoryName: string
    products: Product[]
  }[]
}

interface ProductMasterCategoryRef {
  masterCategoryId: number
  masterCategoryName: string
}

interface ProductCategoryRef {
  categoryId: number
  categoryPrimaryName: string
  masterCategories?: ProductMasterCategoryRef[]
}

type ProductWithMetadata = Product & {
  productTypeDisplay?: string
  categories?: ProductCategoryRef[]
}

type ProductTypeFilter = 'all' | 'Vegetarian' | 'Non-Vegetarian'

const getProductTypeDisplay = (productType?: string): string => {
  if (productType === 'VEG') return 'Vegetarian'
  if (productType === 'NON_VEG') return 'Non-Vegetarian'
  return ''
}

const getProductType = (product: Product): 'VEG' | 'NON_VEG' | undefined => {
  const typedProduct = product as ProductWithMetadata
  const display = String(typedProduct.productTypeDisplay ?? '')
    .trim()
    .toLowerCase()

  // Prefer display text because some payloads carry stale/incorrect enum values.
  if (display.includes('non') && display.includes('veg')) {
    return 'NON_VEG'
  }

  if (display.includes('veg')) {
    return 'VEG'
  }

  const rawProductType = String(typedProduct.productType ?? '')
    .trim()
    .toUpperCase()

  if (
    rawProductType === 'NON_VEG' ||
    rawProductType === 'NON-VEG' ||
    rawProductType === 'NONVEG' ||
    rawProductType === 'NON_VEGETARIAN'
  ) {
    return 'NON_VEG'
  }

  if (
    rawProductType === 'VEG' ||
    rawProductType === 'VEGETARIAN' ||
    rawProductType === 'V'
  ) {
    return 'VEG'
  }

  return undefined
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)

const buildOrderProductRef = (product: Product): OrderProductRef => ({
  productId: product.id,
  productPrimaryName: product.primaryName,
  productSecondaryName: product.secondaryName,
  primaryName: product.primaryName,
  secondaryName: product.secondaryName,
})

const buildOrderItem = (
  product: Product,
  quantity: number
): OrderItem => ({
  id: 0,
  product: buildOrderProductRef(product),
  quantity,
  unitPrice: product.price ?? 0,
  totalPrice: (product.price ?? 0) * quantity,
  productPrimaryName: product.primaryName,
  productSecondaryName: product.secondaryName,
})

const getOrderItemProductId = (item: OrderItem): number | undefined => {
  if (!item.product) return undefined
  return item.product.productId ?? (item.product as Partial<{ id?: number }>).id
}

const ProductMenuSelector = ({
  selectedItems,
  onChange,
  totalPlates = 1,
}: ProductMenuSelectorProps) => {
  const { t } = useTranslation()
  const safeItems = useMemo(() => selectedItems ?? [], [selectedItems])
  const { data: products = [], isLoading } = useFetchProducts()
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(
    {}
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductType, setSelectedProductType] =
    useState<ProductTypeFilter>('all')
  const [selectedMasterCategory, setSelectedMasterCategory] = useState<
    number | null
  >(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Filter products by type
const filteredProducts = useMemo(() => {
  const query = searchQuery.trim().toLowerCase()

  return products.filter((product) => {
    if (selectedProductType !== 'all') {
      const productType = getProductType(product)
      if (selectedProductType === 'Vegetarian' && productType !== 'VEG') return false
      if (selectedProductType === 'Non-Vegetarian' && productType !== 'NON_VEG') return false
    }

    if (query) {
      const primary = (product.primaryName ?? '').toLowerCase()
      const secondary = (product.secondaryName ?? '').toLowerCase()
      if (!primary.includes(query) && !secondary.includes(query)) return false
    }

    return true
  })
}, [products, selectedProductType, searchQuery])
  const selectedTypeCount = useMemo(() => {
    return filteredProducts.length
  }, [filteredProducts])

  // Group products by master categories
  const masterCategoryGroups = useMemo<MasterCategoryGroup[]>(() => {
    const masterMap = new Map<number, MasterCategoryGroup>()

    filteredProducts.forEach((product) => {
      const typedProduct = product as ProductWithMetadata
      const categories = typedProduct.categories ?? []
      categories.forEach((category) => {
        const masterCategories = category.masterCategories ?? []
        masterCategories.forEach((masterCat) => {
          if (!masterMap.has(masterCat.masterCategoryId)) {
            masterMap.set(masterCat.masterCategoryId, {
              masterCategoryId: masterCat.masterCategoryId,
              masterCategoryName: masterCat.masterCategoryName,
              categoryGroups: [],
            })
          }

          const masterGroup = masterMap.get(masterCat.masterCategoryId)!
          let categoryGroup = masterGroup.categoryGroups.find(
            (cg) => cg.categoryId === category.categoryId
          )

          if (!categoryGroup) {
            categoryGroup = {
              categoryId: category.categoryId,
              categoryName: category.categoryPrimaryName,
              products: [],
            }
            masterGroup.categoryGroups.push(categoryGroup)
          }

          // Check if product already exists in this category group
          if (!categoryGroup.products.find((p) => p.id === product.id)) {
            categoryGroup.products.push(product)
          }
        })
      })
    })

    return Array.from(masterMap.values()).sort((a, b) =>
      a.masterCategoryName.localeCompare(b.masterCategoryName)
    )
  }, [filteredProducts])

  // Get all master categories for filter chips
  const masterCategoryOptions = useMemo(() => {
    return masterCategoryGroups.map((group) => ({
      id: group.masterCategoryId,
      name: group.masterCategoryName,
    }))
  }, [masterCategoryGroups])

  // Get categories for selected master category
  const categoryOptions = useMemo(() => {
    if (selectedMasterCategory === null) return []
    const masterGroup = masterCategoryGroups.find(
      (group) => group.masterCategoryId === selectedMasterCategory
    )
    return (
      masterGroup?.categoryGroups.map((group) => ({
        id: group.categoryId,
        name: group.categoryName,
      })) || []
    )
  }, [masterCategoryGroups, selectedMasterCategory])

  // Get filtered products based on all filters
  const displayedProducts = useMemo(() => {
    const seen = new Set<number>()
    const grouped = masterCategoryGroups.flatMap((masterGroup) => {
      if (
        selectedMasterCategory !== null &&
        masterGroup.masterCategoryId !== selectedMasterCategory
      )
        return []

      return masterGroup.categoryGroups.flatMap((categoryGroup) => {
        if (
          selectedCategory !== null &&
          categoryGroup.categoryId !== selectedCategory
        )
          return []
        return categoryGroup.products
      })
    })

    // Deduplicate + re-apply type filter as safety guard
    return grouped.filter((product) => {
      if (seen.has(product.id)) return false
      seen.add(product.id)
      if (selectedProductType === 'all') return true
      const type = getProductType(product)
      if (selectedProductType === 'Vegetarian') return type === 'VEG'
      return type === 'NON_VEG'
    })
  }, [
    masterCategoryGroups,
    selectedMasterCategory,
    selectedCategory,
    selectedProductType,
  ])

  const productsById = useMemo(() => {
    const map = new Map<number, Product>()
    products.forEach((product) => {
      map.set(product.id, product)
    })
    return map
  }, [products])

  const updateItems = (nextItems: OrderItem[]) => onChange(nextItems)

  const handleAddProduct = (productId: number) => {
    const product = productsById.get(productId)
    if (!product) return

    const alreadySelected = safeItems.find(
      (item) => getOrderItemProductId(item) === productId
    )

    if (alreadySelected) {
      updateItems(
        safeItems.map((item) =>
          getOrderItemProductId(item) === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      )
      return
    }

   updateItems([
  ...safeItems,
  buildOrderItem(product, totalPlates || 1),
])
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderItem[]>((acc, item) => {
      if (getOrderItemProductId(item) !== productId) {
        acc.push(item)
        return acc
      }

      const nextQuantity = item.quantity + delta
      if (nextQuantity > 0) {
        acc.push({
          ...item,
          quantity: nextQuantity,
          totalPrice: nextQuantity * item.unitPrice,
        })
      }
      return acc
    }, [])

    updateItems(nextItems)
  }

const handleQuantityInputChange = (productId: number, value: string) => {
  setQuantityDrafts((prev) => ({ ...prev, [productId]: value }))

  // Allow partial input states (empty, lone dot, trailing dot like "1.")
  if (value === '' || value === '.' || value.endsWith('.')) return

  // Allow positive decimals (e.g. 0.5, 1.5, 2)
  if (!/^\d+(\.\d*)?$/.test(value)) return

  const parsedQuantity = parseFloat(value)
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return

  const nextItems = safeItems.map((item) => {
    if (getOrderItemProductId(item) !== productId) return item
    return {
      ...item,
      quantity: parsedQuantity,
      totalPrice: parsedQuantity * item.unitPrice,
    }
  })

  updateItems(nextItems)
}

const handleQuantityInputBlur = (
  productId: number,
  currentQuantity: number
) => {
  const draftValue = quantityDrafts[productId]
  if (draftValue == null) return

  const parsedQuantity = parseFloat(draftValue)
  const isValidQuantity =
    Number.isFinite(parsedQuantity) &&
    parsedQuantity > 0 &&
    /^\d+(\.\d+)?$/.test(draftValue)

  if (!isValidQuantity) {
    setQuantityDrafts((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    return
  }

  if (parsedQuantity !== currentQuantity) {
    const nextItems = safeItems.map((item) => {
      if (getOrderItemProductId(item) !== productId) return item
      return {
        ...item,
        quantity: parsedQuantity,
        totalPrice: parsedQuantity * item.unitPrice,
      }
    })
    updateItems(nextItems)
  }

  setQuantityDrafts((prev) => ({
    ...prev,
    [productId]: String(parsedQuantity),
  }))
}


  return (
    <section className="">
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-7 sm:space-y-9">

          {/* Search Bar */}
<div className="relative">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder={t('search_products') || 'Search by product name...'}
    className="w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 pl-10 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-500 focus:shadow-md"
  />
  <svg
    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  {searchQuery && (
    <button
      type="button"
      onClick={() => setSearchQuery('')}
      aria-label="Clear search"
      className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
    >
      ✕
    </button>
  )}
</div>
          {/* Product Type Filter Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="my-2 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
                {t('product_type') || 'Product Type'}
              </p>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                {selectedTypeCount} {t('items') || 'items'}
              </span>
            </div>
            <div className="scrollbar-hide mb-2 flex gap-3 overflow-x-auto pb-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setSelectedProductType('all')}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedProductType === 'all'
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {t('all')}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductType('Vegetarian')}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedProductType === 'Vegetarian'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {t('vegetarian') || 'Veg'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductType('Non-Vegetarian')}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedProductType === 'Non-Vegetarian'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {t('non_vegetarian') || 'Non-Veg'}
              </button>
            </div>
          </div>

          {/* Master Category Filter Chips */}
          {masterCategoryOptions.length > 0 && (
            <div className="space-y-3">
              <p className="my-2 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
                {t('category') || 'Category'}
              </p>
              <div className="scrollbar-hide mb-2 flex gap-3 overflow-x-auto pb-2 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMasterCategory(null)
                    setSelectedCategory(null)
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                    selectedMasterCategory === null
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {t('all')}
                </button>

                {masterCategoryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedMasterCategory(option.id)
                      setSelectedCategory(null)
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                      selectedMasterCategory === option.id
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subcategory Filter Chips */}
          {selectedMasterCategory !== null && categoryOptions.length > 0 && (
            <div className="space-y-3">
              <p className="my-2 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
                {t('subcategory') || 'Subcategory'}
              </p>
              <div className="scrollbar-hide mb-2 flex gap-3 overflow-x-auto pb-2 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === null
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {t('all')}
                </button>

                {categoryOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedCategory(option.id)}
                    className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                      selectedCategory === option.id
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          {displayedProducts.length > 0 ? (
            <div className="grid  gap-4 grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {displayedProducts.map((product) => {
                const selectedLine = safeItems.find(
                  (item) => getOrderItemProductId(item) === product.id
                )
                const isSelected = Boolean(selectedLine)
                const productType = getProductType(product)
                const accentClass =
                  productType === 'NON_VEG'
                    ? 'from-red-500/10 via-white to-white'
                    : 'from-green-500/10 via-white to-white'
                return (
                  <div
                    key={product.id}
                    className={`group flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? 'border-zinc-300 bg-white'
                        : 'border-[#E4E4E7]/60 bg-white hover:border-zinc-900/25'
                    }`}
                  >
                    <div
                      className={`-mx-4 -mt-4 h-1 bg-linear-to-r ${accentClass}`}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className=" text-sm font-semibold text-zinc-900 sm:text-[15px]">
                            {product.primaryName}
                          </p>
                          {getProductType(product) && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                getProductType(product) === 'VEG'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {getProductTypeDisplay(getProductType(product))}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 sm:text-sm">
                          {product.secondaryName || t('orders_signature_dish')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-zinc-900 sm:text-base">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          {selectedLine?.quantity ?? 1} selected
                        </span>
                      )}
                    </div>

                    {isSelected ? (
                      <>
                        <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-2">
                          <button
                            type="button"
                            aria-label={t('decrease_quantity')}
                            onClick={() =>
                              product.id && handleQuantityChange(product.id, -1)
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
                          >
                            <Minus size={14} strokeWidth={2.5} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={
                              quantityDrafts[product.id] ??
                              String(selectedLine?.quantity ?? 1)
                            }
                            onChange={(event) =>
                              product.id &&
                              handleQuantityInputChange(
                                product.id,
                                event.target.value
                              )
                            }
                            onBlur={() =>
                              handleQuantityInputBlur(
                                product.id,
                                selectedLine?.quantity ?? 1
                              )
                            }
                            className="h-9 w-14 rounded-lg border-2 border-zinc-200 bg-white text-center text-sm font-bold text-zinc-900 transition outline-none focus:border-zinc-900 focus:shadow-md"
                          />
                          <button
                            type="button"
                            aria-label={t('increase_quantity')}
                            onClick={() =>
                              product.id && handleQuantityChange(product.id, 1)
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-green-500 text-white transition hover:bg-green-600 active:scale-95"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </button>
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-amber-700">
                              {t('price_per_plate') || 'Price per plate'}
                            </span>
                            <span className="text-sm font-semibold text-amber-900">
                              {formatCurrency(selectedLine?.unitPrice ?? product.price ?? 0)}
                            </span>
                          </div>
                          <div className="border-t border-amber-200 pt-2 flex justify-between items-center">
                            <span className="text-xs font-medium text-amber-700">
                              {t('total_price') || 'Total price'}
                            </span>
                            <span className="text-sm font-bold text-amber-900">
                              {formatCurrency(selectedLine?.totalPrice ?? product.price ?? 0)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <ButtonSm
                        type="button"
                        state="default"
                        onClick={() => handleAddProduct(product.id)}
                        className="rounded-lg border border-[#E4E4E7] px-3 py-2 text-[10px] font-semibold tracking-wide uppercase sm:text-xs"
                      >
                        {t('add')}
                      </ButtonSm>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-zinc-500">
                {t('no_products_found') || 'No products found'}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default ProductMenuSelector
