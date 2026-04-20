import { useEffect, useMemo, useState } from 'react'
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
}

interface GroupedProducts {
  categoryId: number
  categoryName: string
  products: Product[]
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

const buildOrderItem = (product: Product): OrderItem => ({
  id: 0,
  product: buildOrderProductRef(product),
  quantity: 1,
  unitPrice: product.price ?? 0,
  totalPrice: product.price ?? 0,
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
}: ProductMenuSelectorProps) => {
  const { t } = useTranslation()
  const safeItems = selectedItems || []
  const { data: products = [], isLoading } = useFetchProducts()
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(
    {}
  )
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const groupedProducts = useMemo<GroupedProducts[]>(() => {
    const collection = new Map<number, GroupedProducts>()

    products.forEach((product) => {
      const categoryId = product.categoryIds?.[0] ?? 0
      const categoryName = 'Products' // Default category name since categoryIds contains only IDs

      if (!collection.has(categoryId)) {
        collection.set(categoryId, {
          categoryId,
          categoryName,
          products: [],
        })
      }

      collection.get(categoryId)?.products.push(product)
    })

    return Array.from(collection.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName)
    )
  }, [products, t])

  const displayGroups = useMemo(() => {
    if (selectedCategory === null) return groupedProducts
    return groupedProducts.filter((group) => group.categoryId === selectedCategory)
  }, [groupedProducts, selectedCategory])

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
        const productId = getOrderItemProductId(item)
        if (productId && productId in prev) {
          next[productId] = prev[productId]
        }
      })
      return next
    })
  }, [safeItems])

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
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      return
    }

    updateItems([...safeItems, buildOrderItem(product)])
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderItem[]>((acc, item) => {
      if (getOrderItemProductId(item) !== productId) {
        acc.push(item)
        return acc
      }

      const nextQuantity = item.quantity + delta
      if (nextQuantity > 0) {
        acc.push({ ...item, quantity: nextQuantity })
      }
      return acc
    }, [])

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
      if (getOrderItemProductId(item) !== productId) return item

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
        if (getOrderItemProductId(item) !== productId) return item

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
        <div className="space-y-4 sm:space-y-6">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {/* "All" chip */}
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap  mb-3 rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === null
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900'
              }`}
            >
              {t('all')}
            </button>

            {/* Category chips */}
            {groupedProducts.map((group) => (
              <button
                key={group.categoryId}
                type="button"
                onClick={() => setSelectedCategory(group.categoryId)}
                className={`whitespace-nowrap rounded-full px-3 py-1 mb-3 text-xs font-medium transition ${
                  selectedCategory === group.categoryId
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-900'
                }`}
              >
                {group.categoryName}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {displayGroups.map((group) => (
            <div key={group.categoryId}>
              <p className="mb-3 text-[10px] font-semibold tracking-[0.3em] text-zinc-500 uppercase sm:text-[12px]">
                {group.categoryName}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.products.map((product) => {
                  const selectedLine = safeItems.find(
                    (item) => getOrderItemProductId(item) === product.id
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
                            {product.secondaryName ||
                              t('orders_signature_dish')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 sm:text-sm">
                        {formatCurrency(product.price ?? 0)}
                      </span>
                      {isSelected ? (
                        <div 
                          className="flex items-center gap-2 rounded-lg p-2 shadow-sm"
                          style={{ background: 'linear-gradient(to right, rgb(245, 245, 245), rgb(228, 228, 231))' }}
                        >
                          <button
                            type="button"
                            aria-label={t('decrease_quantity')}
                            onClick={() =>
                              product.id && handleQuantityChange(product.id, -1)
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
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
                            className="h-8 w-12 rounded-md border-2 border-zinc-200 bg-white text-center text-sm font-bold text-zinc-900 outline-none transition focus:border-zinc-900 focus:shadow-md"
                          />
                          <button
                            type="button"
                            aria-label={t('increase_quantity')}
                            onClick={() =>
                              product.id && handleQuantityChange(product.id, 1)
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-green-500 text-white transition hover:bg-green-600 active:scale-95"
                          >
                            <Plus size={14} strokeWidth={2.5} />
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
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProductMenuSelector
