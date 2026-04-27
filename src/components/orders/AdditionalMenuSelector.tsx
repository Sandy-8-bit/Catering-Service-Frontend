import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from '@/components/common/Spinner'
import { useFetchProducts } from '@/queries/productQueries'
import type { OrderAdditionalMenuItem } from '@/types/order'
import type { Product } from '@/types/product'
import { Minus, Plus } from 'lucide-react'
import ButtonSm from '../common/Buttons'

interface AdditionalMenuSelectorProps {
  selectedItems: OrderAdditionalMenuItem[]
  onChange: (items: OrderAdditionalMenuItem[]) => void
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

type ProductTypeFilter = 'all' | 'veg' | 'nonveg'

const getProductTypeDisplay = (productType?: string): string => {
  if (productType === 'VEG') return 'Vegetarian'
  if (productType === 'NON_VEG') return 'Non-Vegetarian'
  return ''
}

const getProductType = (product: Product): 'VEG' | 'NON_VEG' | undefined => {
  // Try to get productType directly
  if ((product as any).productType) return (product as any).productType
  // Fallback to productTypeDisplay
  const display = (product as any).productTypeDisplay
  if (display === 'Vegetarian') return 'VEG'
  if (display === 'Non-Vegetarian') return 'NON_VEG'
  return undefined
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)

const AdditionalMenuSelector = ({
  selectedItems,
  onChange,
}: AdditionalMenuSelectorProps) => {
  const { t } = useTranslation()
  const safeItems = selectedItems || []
  const { data: products = [], isLoading } = useFetchProducts()
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(
    {}
  )
  const [selectedProductType, setSelectedProductType] =
    useState<ProductTypeFilter>('all')
  const [selectedMasterCategory, setSelectedMasterCategory] = useState<
    number | null
  >(null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Filter products by type
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedProductType === 'all') return true
      const productType = getProductType(product)
      if (selectedProductType === 'veg') return productType === 'VEG'
      if (selectedProductType === 'nonveg') return productType === 'NON_VEG'
      return true
    })
  }, [products, selectedProductType])

  // Group products by master categories
  const masterCategoryGroups = useMemo<MasterCategoryGroup[]>(() => {
    const masterMap = new Map<number, MasterCategoryGroup>()

    filteredProducts.forEach((product) => {
      const categories = (product as any).categories || []
      categories.forEach((category: any) => {
        const masterCategories = category.masterCategories || []
        masterCategories.forEach((masterCat: any) => {
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
    return masterCategoryGroups.flatMap((masterGroup) => {
      // If master category is selected, only show that group
      if (
        selectedMasterCategory !== null &&
        masterGroup.masterCategoryId !== selectedMasterCategory
      ) {
        return []
      }

      return masterGroup.categoryGroups.flatMap((categoryGroup) => {
        // If category is selected, only show that category
        if (
          selectedCategory !== null &&
          categoryGroup.categoryId !== selectedCategory
        ) {
          return []
        }

        return categoryGroup.products
      })
    })
  }, [masterCategoryGroups, selectedMasterCategory, selectedCategory])

  const productsById = useMemo(() => {
    const map = new Map<number, Product>()
    products.forEach((product) => {
      map.set(product.id, product)
    })
    return map
  }, [products])

  useEffect(() => {
    setQuantityDrafts((prev) => {
      const next: Record<number, string> = {}
      safeItems.forEach((item) => {
        if (item.productId in prev) {
          next[item.productId] = prev[item.productId]
        }
      })
      return next
    })
  }, [safeItems])

  const updateItems = (nextItems: OrderAdditionalMenuItem[]) =>
    onChange(nextItems)

  const handleAddProduct = (productId: number) => {
    const product = productsById.get(productId)
    if (!product) return

    const alreadySelected = safeItems.find(
      (item) => item.productId === productId
    )

    if (alreadySelected) {
      updateItems(
        safeItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      return
    }

    updateItems([...safeItems, { productId, quantity: 1 }])
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderAdditionalMenuItem[]>(
      (acc, item) => {
        if (item.productId !== productId) {
          acc.push(item)
          return acc
        }

        const nextQuantity = item.quantity + delta
        if (nextQuantity > 0) {
          acc.push({ ...item, quantity: nextQuantity })
        }
        return acc
      },
      []
    )

    updateItems(nextItems)
  }

  const handleQuantityInputChange = (productId: number, value: string) => {
    setQuantityDrafts((prev) => ({
      ...prev,
      [productId]: value,
    }))

    if (value === '' || !/^\d+$/.test(value)) return

    const parsedQuantity = Number.parseInt(value, 10)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) return

    const nextItems = safeItems.map((item) => {
      if (item.productId !== productId) return item

      return { ...item, quantity: parsedQuantity }
    })

    updateItems(nextItems)
  }

  const handleQuantityInputBlur = (
    productId: number,
    currentQuantity: number
  ) => {
    const draftValue = quantityDrafts[productId]

    if (draftValue == null) return

    const parsedQuantity = Number.parseInt(draftValue, 10)
    const isValidQuantity =
      Number.isFinite(parsedQuantity) &&
      parsedQuantity >= 1 &&
      /^\d+$/.test(draftValue)

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
        if (item.productId !== productId) return item

        return { ...item, quantity: parsedQuantity }
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
          {/* Product Type Filter Chips */}
          <div className="space-y-3">
            <p className="my-2 text-xs font-semibold tracking-wider text-zinc-600 uppercase">
              {t('product_type') || 'Product Type'}
            </p>
            <div className="mb-2 flex flex-wrap gap-3">
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
                onClick={() => setSelectedProductType('veg')}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedProductType === 'veg'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'border-2 border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {t('vegetarian') || 'Veg'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedProductType('nonveg')}
                className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedProductType === 'nonveg'
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
              <div className="mb-2 flex gap-3 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
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
              <div className="mb-2 flex gap-3 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {displayedProducts.map((product) => {
                const selectedLine = safeItems.find(
                  (item) => item.productId === product.id
                )
                const isSelected = Boolean(selectedLine)
                return (
                  <div
                    key={product.id}
                    className={`flex flex-col gap-3 rounded-md border p-3 transition ${
                      isSelected
                        ? 'border-zinc-300 bg-white shadow-sm'
                        : 'border-[#E4E4E7]/50 bg-white shadow-sm hover:border-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900 sm:text-sm">
                          {product.primaryName}
                        </p>
                        <p className="text-[10px] text-zinc-500 sm:text-xs">
                          {product.secondaryName || t('orders_signature_dish')}
                        </p>
                        {getProductType(product) && (
                          <p
                            className={`text-[10px] font-medium ${
                              getProductType(product) === 'VEG'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {getProductTypeDisplay(getProductType(product))}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-900 sm:text-sm">
                      {formatCurrency(product.price ?? 0)}
                    </span>
                    {isSelected ? (
                      <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white px-2 py-1.5">
                        <button
                          type="button"
                          aria-label={t('decrease_quantity')}
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                        >
                          <Minus size={12} />
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
                          className="h-7 w-12 rounded-md border border-[#E4E4E7] text-center text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          aria-label={t('increase_quantity')}
                          onClick={() =>
                            product.id && handleQuantityChange(product.id, 1)
                          }
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <ButtonSm
                        type="button"
                        state="default"
                        onClick={() => handleAddProduct(product.id)}
                        className="rounded-sm border border-[#E4E4E7] px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase sm:text-xs"
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

export default AdditionalMenuSelector
