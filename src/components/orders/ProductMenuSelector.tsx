import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/common/Spinner'
import DialogBox from '@/components/common/DialogBox'
import { useFetchProducts } from '@/queries/productQueries'
import type { OrderItem, OrderProductRef } from '@/types/order'
import type { Product } from '@/types/product'
import { Minus, Plus, Search, X } from 'lucide-react'
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

type CategoryFilter = number | 'all'

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
  const safeItems = selectedItems || []
  const { data: products = [], isLoading } = useFetchProducts()
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const groupedProducts = useMemo<GroupedProducts[]>(() => {
    const collection = new Map<number, GroupedProducts>()

    products.forEach((product) => {
      const categoryId = product.category?.id ?? 0
      const categoryName = product.category?.primaryName || 'Uncategorized'

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
  }, [products])

  const productsById = useMemo(() => {
    const map = new Map<number, Product>()
    products.forEach((product) => {
      map.set(product.id, product)
    })
    return map
  }, [products])

  useEffect(() => {
    if (!groupedProducts.length) {
      setActiveCategory('all')
      return
    }

    setActiveCategory((prev) => {
      if (prev === 'all') return prev
      return groupedProducts.some((group) => group.categoryId === prev)
        ? prev
        : 'all'
    })
  }, [groupedProducts])

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const groups =
      activeCategory === 'all'
        ? groupedProducts
        : groupedProducts.filter((group) => group.categoryId === activeCategory)

    return groups
      .map((group) => ({
        ...group,
        products: group.products.filter((product) => {
          if (!normalizedSearch) return true
          const haystack =
            `${product.primaryName ?? ''} ${product.secondaryName ?? ''} ${group.categoryName}`.toLowerCase()
          return haystack.includes(normalizedSearch)
        }),
      }))
      .filter((group) => group.products.length > 0)
  }, [groupedProducts, activeCategory, searchTerm])

  const updateItems = (nextItems: OrderItem[]) => onChange(nextItems)

  const handleAddProduct = (productId: number) => {
    const product = productsById.get(productId)
    if (!product) return

    const alreadySelected = safeItems.find(
      (item) => getOrderItemProductId(item) === productId
    )

    if (alreadySelected) {
      const unitPrice = alreadySelected.unitPrice ?? product.price ?? 0
      updateItems(
        safeItems.map((item) =>
          getOrderItemProductId(item) === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: unitPrice * (item.quantity + 1),
              }
            : item
        )
      )
      return
    }

    updateItems([...safeItems, buildOrderItem(product)])
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderItem[]>((acc, item) => {
      const lineProductId = getOrderItemProductId(item)
      if (lineProductId !== productId) {
        acc.push(item)
        return acc
      }

      const nextQuantity = item.quantity + delta
      if (nextQuantity > 0) {
        const fallbackProduct = productsById.get(lineProductId ?? productId)
        const unitPrice = item.unitPrice ?? fallbackProduct?.price ?? 0
        acc.push({
          ...item,
          quantity: nextQuantity,
          totalPrice: unitPrice * nextQuantity,
        })
      }
      return acc
    }, [])

    updateItems(nextItems)
  }

  const totalProductCount = safeItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  )
  const totalProductCost = safeItems.reduce((sum, item) => {
    const lineValue =
      typeof item.totalPrice === 'number'
        ? item.totalPrice
        : (item.unitPrice ?? 0) * (item.quantity || 0)
    return sum + lineValue
  }, 0)

  const summaryCards = safeItems
    .filter((line) => line.product)
    .map((line) => {
      const productRef = line.product!
      const lineProductId =
        productRef.productId ?? (productRef as Partial<{ id?: number }>).id
      const fallbackProduct = lineProductId
        ? productsById.get(lineProductId)
        : undefined
      const displayName =
        productRef.productPrimaryName ||
        productRef.primaryName ||
        fallbackProduct?.primaryName ||
        'Product'
      const unitPrice = line.unitPrice ?? fallbackProduct?.price ?? 0

      return (
        <article
          key={`${displayName}-${lineProductId ?? displayName}`}
          className="flex flex-col gap-4 rounded-md border border-[#E4E4E7] bg-[#F9F9F9] p-4 text-zinc-900"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {displayName}
              </p>
              <p className="text-xs text-zinc-500">
                {line.quantity} x {formatCurrency(unitPrice)}
              </p>
            </div>
            <span className="text-sm font-semibold text-zinc-900">
              {formatCurrency(unitPrice * line.quantity)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white p-2">
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() =>
                  lineProductId && handleQuantityChange(lineProductId, -1)
                }
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
              >
                <Minus size={12} />
              </button>
              <span className="min-w-7 text-center text-sm font-semibold">
                {line.quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  lineProductId && handleQuantityChange(lineProductId, 1)
                }
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </article>
      )
    })

  const drawerContent = (
    <div className="flex h-full w-full flex-col bg-white">
      <header className="flex items-center justify-between border-b border-[#F1F1F1] pb-4">
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase">
            Menu builder
          </p>
          <h2 className="text-xl font-semibold text-zinc-900">
            Menu Items Selection
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close menu drawer"
          onClick={() => setIsDrawerOpen(false)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-[#E4E4E7] bg-black text-zinc-500 transition hover:bg-zinc-100"
        >
          <X className="text-white" size={18} />
        </button>
      </header>

      <div className="mt-4 flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#F1F1F1] pb-4">
          <div className="flex items-center gap-2 rounded-md border border-[#E4E4E7] bg-gray-50 px-4 py-2">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search dishes or cuisines"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border-none bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-md border border-[#D4D4D8] px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition ${
                activeCategory === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              All
            </button>
            {groupedProducts.map((group) => (
              <button
                type="button"
                key={group.categoryId}
                onClick={() => setActiveCategory(group.categoryId)}
                className={`rounded-md border border-[#D4D4D8] px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition ${
                  activeCategory === group.categoryId
                    ? 'bg-zinc-900 text-white'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                {group.categoryName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-32">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-sm text-zinc-500">
              Nothing matches your search right now.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.categoryId} className="mt-4 space-y-3">
                <div>
                  <p className="mb-4 text-[12px] font-semibold tracking-[0.3em] text-zinc-500 uppercase">
                    {group.categoryName}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.products.map((product) => {
                    const selectedLine = safeItems.find(
                      (item) => getOrderItemProductId(item) === product.id
                    )
                    const isSelected = Boolean(selectedLine)
                    return (
                      <div
                        key={product.id}
                        className={`flex flex-col gap-4 rounded-md border p-4 transition ${
                          isSelected
                            ? 'border-zinc-300 bg-white shadow-sm'
                            : 'border-[#E4E4E7]/50 bg-white shadow-sm hover:border-zinc-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-zinc-900">
                              {product.primaryName}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {product.secondaryName || 'Signature dish'}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-zinc-900">
                            {formatCurrency(product.price ?? 0)}
                          </span>
                        </div>
                        {isSelected ? (
                          <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white px-4 py-2">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                product.id &&
                                handleQuantityChange(product.id, -1)
                              }
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-semibold text-zinc-900">
                              {selectedLine?.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                product.id &&
                                handleQuantityChange(product.id, 1)
                              }
                              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <ButtonSm
                            type="button"
                            state="default"
                            onClick={() => handleAddProduct(product.id)}
                            className="rounded-sm border border-[#E4E4E7] px-5 py-2 text-xs font-semibold tracking-wide uppercase"
                          >
                            Add
                          </ButtonSm>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sticky right-0 bottom-0 left-0 mt-auto border-t border-[#E4E4E7] bg-white p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Summary
            </p>
            <p className="text-base font-semibold text-zinc-900">
              {totalProductCount} items · {formatCurrency(totalProductCost)}
            </p>
          </div>
          <ButtonSm
            type="button"
            state="default"
            className="w-full rounded-sm border border-[#E4E4E7] px-6 py-3 text-sm font-semibold tracking-wide uppercase sm:w-auto"
            onClick={() => setIsDrawerOpen(false)}
          >
            Review selection
          </ButtonSm>
        </div>
      </div>
    </div>
  )

  return (
    <section className="">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <header className="mt-6 space-y-1">
          <h2 className="text-base font-semibold text-zinc-800">Menu Items</h2>
          <p className="text-sm text-zinc-500">
            Added dishes · {totalProductCount} items
          </p>
        </header>

        <ButtonSm
          type="button"
          state="default"
          className="rounded-sm border border-[#E4E4E7] px-4 py-2 text-xs font-semibold tracking-wide uppercase"
          onClick={() => setIsDrawerOpen(true)}
        >
          Add more +
        </ButtonSm>
      </header>

      {safeItems.length === 0 ? (
        <div className="border border-dashed border-[#E4E4E7] bg-[#F9F9F9] px-4 py-8 text-center text-sm text-zinc-500">
          No dishes have been added yet. Tap “Add more +” to start curating the
          menu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summaryCards}
        </div>
      )}

      {isDrawerOpen && (
        <DialogBox
          isSideDrawer
          width="100vw"
          setToggleDialogueBox={setIsDrawerOpen}
        >
          {drawerContent}
        </DialogBox>
      )}
    </section>
  )
}

export default ProductMenuSelector
