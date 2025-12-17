import { useMemo } from 'react'
import Spinner from '@/components/common/Spinner'
import type { AdditionalItem } from '@/types/AdditionalItem'
import type { OrderAdditionalItemPayload } from '@/types/Order'
import { Minus, Plus } from 'lucide-react'
import ButtonSm from '@/components/common/Buttons'

interface AdditionalItemsSelectorProps {
  availableItems: AdditionalItem[]
  selectedItems?: OrderAdditionalItemPayload[]
  onChange: (items: OrderAdditionalItemPayload[]) => void
  isLoading?: boolean
}

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)

const AdditionalItemsSelector = ({
  availableItems,
  selectedItems = [],
  onChange,
  isLoading = false,
}: AdditionalItemsSelectorProps) => {
  const safeItems = selectedItems || []

  const additionalItemMap = useMemo(() => {
    const map = new Map<number, AdditionalItem>()
    availableItems.forEach((item) => map.set(item.id, item))
    return map
  }, [availableItems])

  const handleAddItem = (additionalItemId: number) => {
    const existing = safeItems.find(
      (item) => item.additionalItemId === additionalItemId
    )

    if (existing) {
      onChange(
        safeItems.map((item) =>
          item.additionalItemId === additionalItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
      return
    }

    onChange([...safeItems, { additionalItemId, quantity: 1, returned: false }])
  }

  const handleQuantityChange = (additionalItemId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderAdditionalItemPayload[]>(
      (acc, item) => {
        if (item.additionalItemId !== additionalItemId) {
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

    onChange(nextItems)
  }

  const selectedDetails = safeItems.map((item) => ({
    ...item,
    additionalItem: additionalItemMap.get(item.additionalItemId),
  }))

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <section className="w-full rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm lg:w-1/2">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              Additional Items List
            </p>
            <h2 className="text-base font-semibold text-zinc-800">Extras</h2>
          </div>
          <span className="text-xs font-medium text-zinc-400">
            {availableItems.length} items
          </span>
        </header>

        {isLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <Spinner />
          </div>
        ) : availableItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#E4E4E7] bg-gray-50 p-4 text-center text-sm text-gray-500">
            No additional items found.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {availableItems.map((item) => {
              const isAdded = safeItems.some(
                (selected) => selected.additionalItemId === item.id
              )
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-[#EFEFEF] bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-800">
                      {item.primaryName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatCurrency(item.pricePerUnit)}
                    </p>
                  </div>
                  <ButtonSm
                    state="default"
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleAddItem(item.id)}
                    className={`min-w-[82px] origin-right scale-90 rounded-md border px-3 py-1.5! text-xs font-semibold ${
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
        )}
      </section>

      <section className="w-full rounded-lg border border-[#E4E4E7] bg-white p-4 shadow-sm lg:w-1/2">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">
            Selected Additional Items
          </h2>
          {safeItems.length > 0 && (
            <span className="text-xs font-medium text-zinc-400">
              {safeItems.length} items
            </span>
          )}
        </header>

        {safeItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-sm text-gray-500">
            No additional items selected yet. Use the list to add items.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="hidden items-start justify-between px-3 py-2 text-xs font-semibold tracking-wide text-zinc-600 uppercase md:flex">
              <span className="w-14 text-left">S.No</span>
              <span className="flex-1 text-left">Item</span>
              <span className="w-28 text-left">Price</span>
              <span className="w-36 text-left">Quantity</span>
            </div>
            {selectedDetails.map((line, index) => {
              const item = line.additionalItem
              return (
                <div
                  key={`${line.additionalItemId}-${index}`}
                  className="bg-white px-3"
                >
                  <div className="flex flex-col text-left md:flex-row md:items-center md:justify-between">
                    <span className="w-14 text-sm font-semibold text-zinc-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-900">
                        {item?.primaryName || 'Additional Item'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item?.secondaryName ||
                          item?.description ||
                          'No description'}
                      </p>
                    </div>
                    <span className="w-28 text-left text-sm font-semibold text-gray-900">
                      {formatCurrency(item?.pricePerUnit)}
                    </span>
                    <div className="flex w-36 items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-gray-700">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(line.additionalItemId, -1)
                        }
                        className="cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(line.additionalItemId, 1)
                        }
                        className="cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
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

export default AdditionalItemsSelector
