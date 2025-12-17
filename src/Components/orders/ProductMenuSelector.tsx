import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/common/Spinner'
import { useFetchProducts } from '@/queries/ProductQueries'
import type { OrderItemPayload } from '@/types/Order'
import type { Product } from '@/types/Product'
import { Minus, Plus } from 'lucide-react'
import ButtonSm from '../common/Buttons'

interface ProductMenuSelectorProps {
  selectedItems: OrderItemPayload[]
  onChange: (items: OrderItemPayload[]) => void
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

const ProductMenuSelector = ({
  selectedItems,
  onChange,
}: ProductMenuSelectorProps) => {
  const safeItems = selectedItems || []
  const { data: products = [], isLoading } = useFetchProducts()
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null)

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedCategory(null)
      return
    }

    setExpandedCategory((prev) => {
      if (
        prev !== null &&
        groupedProducts.some((group) => group.categoryId === prev)
      ) {
        return prev
      }
      return groupedProducts[0]?.categoryId ?? null
    })
  }, [groupedProducts])

  const updateItems = (nextItems: OrderItemPayload[]) => {
    onChange(nextItems)
  }

  const handleAddProduct = (productId: number) => {
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
    } else {
      updateItems([...safeItems, { productId, quantity: 1 }])
    }
  }

  const handleQuantityChange = (productId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderItemPayload[]>((acc, item) => {
      if (item.productId !== productId) {
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

  const selectedDetails = safeItems.map((item) => ({
    ...item,
    product: productsById.get(item.productId),
  }))

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <section className="w-full rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm lg:w-1/2">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-800">Products</h2>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            {products.length} items
          </span>
        </header>

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Spinner />
          </div>
        ) : groupedProducts.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#E4E4E7] bg-gray-50 p-4 text-center text-sm text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groupedProducts.map((group) => {
              const isOpen = expandedCategory === group.categoryId
              return (
                <div key={group.categoryId} className="card">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategory((prev) =>
                        prev === group.categoryId ? null : group.categoryId
                      )
                    }
                    className="flex w-full items-center justify-between py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-zinc-800">
                      {group.categoryName}
                    </span>
                    <svg
                      className={`h-4 w-4 cursor-pointer text-zinc-500 transition-transform ${isOpen ? '-scale-y-100' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#F4F4F5] py-3">
                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                        {group.products.map((product) => {
                          const isAdded = safeItems.some(
                            (item) => item.productId === product.id
                          )
                          return (
                            <div
                              key={product.id}
                              className="flex items-center justify-between gap-3 rounded-md border border-[#EFEFEF] bg-white px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-800">
                                  {product.primaryName}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                              <ButtonSm
                                state="default"
                                type="button"
                                onClick={() => handleAddProduct(product.id)}
                                disabled={isAdded}
                                className={`min-w-[82px] origin-right scale-90 rounded-md border px-3 py-1.5! text-xs font-semibold transition-colors ${
                                  isAdded
                                    ? 'border-zinc-200 bg-zinc-100 text-zinc-400 opacity-80! disabled:cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                {isAdded ? 'Added' : 'Add'}
                              </ButtonSm>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="w-full rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm lg:w-1/2">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Added Products
          </h2>
          {safeItems.length > 0 && (
            <span className="text-xs font-medium text-zinc-400">
              {safeItems.length} items
            </span>
          )}
        </header>

        {safeItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-sm text-gray-500">
            No products added yet. Choose items from the list to get started.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="hidden items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-zinc-600 uppercase md:flex">
              <span className="w-14">S.No</span>
              <span className="flex-1 text-left">Product</span>
              <span className="w-28 text-left">Price</span>
              <span className="w-36 text-left">Quantity</span>
            </div>
            {selectedDetails.map((line, index) => {
              const product = line.product
              return (
                <div
                  key={`${line.productId}-${index}`}
                  className="bg-white px-3"
                >
                  <div className="flex flex-col text-left md:flex-row md:items-center md:justify-between">
                    <span className="w-14 text-sm font-semibold text-zinc-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-900">
                        {product?.primaryName || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product
                          ? `${formatCurrency(product.price)} each`
                          : 'Price unavailable'}
                      </p>
                    </div>
                    <span className="w-28 text-left text-sm font-semibold text-gray-900">
                      {formatCurrency(product?.price || 0)}
                    </span>
                    <div className="flex w-36 items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(line.productId, -1)}
                        className="cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-gray-600 transition-all duration-150 ease-in-out hover:text-gray-900"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(line.productId, 1)}
                        className="transtio cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default ProductMenuSelector
