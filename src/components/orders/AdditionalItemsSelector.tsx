import { useMemo, useState } from 'react'
import Spinner from '@/components/common/Spinner'
import DialogBox from '@/components/common/DialogBox'
import type { AdditionalItem } from '@/types/additionalItem'
import type { OrderAdditionalItem } from '@/types/order'
import { Minus, Plus, Search, X } from 'lucide-react'
import ButtonSm from '@/components/common/Buttons'

interface AdditionalItemsSelectorProps {
  availableItems: AdditionalItem[]
  selectedItems?: OrderAdditionalItem[]
  onChange: (items: OrderAdditionalItem[]) => void
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const additionalItemMap = useMemo(() => {
    const map = new Map<number, AdditionalItem>()
    availableItems.forEach((item) => map.set(item.id, item))
    return map
  }, [availableItems])

  const sortedItems = useMemo(
    () =>
      [...availableItems].sort((a, b) =>
        a.primaryName.localeCompare(b.primaryName)
      ),
    [availableItems]
  )

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return sortedItems
    return sortedItems.filter((item) =>
      `${item.primaryName} ${item.secondaryName ?? ''}`
        .toLowerCase()
        .includes(normalized)
    )
  }, [sortedItems, searchTerm])

  const createOrderAdditionalItem = (
    item: AdditionalItem
  ): OrderAdditionalItem => ({
    id: 0,
    additionalItem: {
      additionalItemId: item.id,
      additionalItemPrimaryName: item.primaryName,
      additionalItemSecondaryName: item.secondaryName,
    },
    quantity: 1,
    priceAtOrder: item.pricePerUnit ?? 0,
    lineTotal: item.pricePerUnit ?? 0,
    returned: false,
  })

  const handleAddItem = (additionalItemId: number) => {
    const catalogItem = additionalItemMap.get(additionalItemId)
    if (!catalogItem) return

    const existing = safeItems.find(
      (item) => item.additionalItem.additionalItemId === additionalItemId
    )

    if (existing) {
      onChange(
        safeItems.map((item) =>
          item.additionalItem.additionalItemId === additionalItemId
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal:
                  (item.priceAtOrder ?? catalogItem.pricePerUnit ?? 0) *
                  (item.quantity + 1),
              }
            : item
        )
      )
      return
    }

    onChange([...safeItems, createOrderAdditionalItem(catalogItem)])
  }

  const handleQuantityChange = (additionalItemId: number, delta: number) => {
    const nextItems = safeItems.reduce<OrderAdditionalItem[]>((acc, item) => {
      if (item.additionalItem.additionalItemId !== additionalItemId) {
        acc.push(item)
        return acc
      }

      const nextQuantity = item.quantity + delta
      if (nextQuantity > 0) {
        const catalogItem = additionalItemMap.get(additionalItemId)
        const unitPrice = item.priceAtOrder ?? catalogItem?.pricePerUnit ?? 0
        acc.push({
          ...item,
          quantity: nextQuantity,
          lineTotal: unitPrice * nextQuantity,
        })
      }
      return acc
    }, [])

    onChange(nextItems)
  }

  const selectedDetails = safeItems.map((item) => ({
    record: item,
    catalog: additionalItemMap.get(item.additionalItem.additionalItemId),
  }))

  const totalExtrasCount = safeItems.reduce(
    (sum, line) => sum + (line.quantity || 0),
    0
  )
  const totalExtrasCost = safeItems.reduce((sum, line) => {
    const lineTotal =
      typeof line.lineTotal === 'number'
        ? line.lineTotal
        : (line.priceAtOrder ?? 0) * (line.quantity || 0)
    return sum + lineTotal
  }, 0)

  const summaryCards = selectedDetails.map(({ record, catalog }) => {
    const info = record.additionalItem
    const displayName =
      info.additionalItemPrimaryName || catalog?.primaryName || 'Extra'
    const description =
      catalog?.secondaryName ||
      catalog?.description ||
      info.additionalItemSecondaryName ||
      'Perfect add-on'
    const unitPrice = record.priceAtOrder ?? catalog?.pricePerUnit ?? 0

    return (
      <article
        key={info.additionalItemId}
        className="flex flex-col gap-4 rounded-md border border-[#E4E4E7] bg-[#F9F9F9] p-4 text-zinc-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {displayName}
            </p>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
          <span className="text-sm font-semibold text-zinc-900">
            {formatCurrency(unitPrice * record.quantity)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white p-2">
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => handleQuantityChange(info.additionalItemId, -1)}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
            >
              <Minus size={12} />
            </button>
            <span className="min-w-[28px] text-center text-sm font-semibold">
              {record.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => handleQuantityChange(info.additionalItemId, 1)}
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
          <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
            Extras cart
          </p>
          <h2 className="text-xl font-semibold text-zinc-900">
            Additional Items Selector
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close additional items drawer"
          onClick={() => setIsDrawerOpen(false)}
          className="flex h-10 w-10 items-center justify-center border border-[#E4E4E7] text-zinc-500 transition hover:bg-zinc-100"
        >
          <X size={18} />
        </button>
      </header>

      <div className="mt-4 flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#F1F1F1] pb-4">
          <div className="flex items-center gap-2 rounded-md border border-[#E4E4E7] bg-gray-50 px-4 py-2">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search add-ons"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full border-none bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-32">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-sm text-zinc-500">
              No add-ons match that search.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const existing = safeItems.find(
                  (line) => line.additionalItem.additionalItemId === item.id
                )
                const isSelected = Boolean(existing)
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col gap-4 rounded-md border p-4 transition ${
                      isSelected
                        ? 'border-zinc-300 bg-white shadow-sm'
                        : 'border-[#E4E4E7]/50 bg-white shadow-sm hover:border-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-zinc-900">
                          {item.primaryName}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {item.secondaryName || 'Perfect pairing'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatCurrency(item.pricePerUnit)}
                      </span>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white px-4 py-2">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold text-zinc-900">
                          {existing?.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <ButtonSm
                        type="button"
                        state="default"
                        onClick={() => handleAddItem(item.id)}
                        className="rounded-sm border border-[#E4E4E7] px-5 py-2 text-xs font-semibold tracking-wide uppercase"
                      >
                        Add
                      </ButtonSm>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="sticky right-0 bottom-0 left-0 mt-auto border-t border-[#E4E4E7] bg-white p-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase">
              Extras bag
            </p>
            <p className="text-base font-semibold text-zinc-900">
              {totalExtrasCount} items · {formatCurrency(totalExtrasCost)}
            </p>
          </div>
          <ButtonSm
            type="button"
            state="default"
            className="w-full rounded-sm border border-[#E4E4E7] px-6 py-3 text-sm font-semibold tracking-wide uppercase sm:w-auto"
            onClick={() => setIsDrawerOpen(false)}
          >
            Review extras
          </ButtonSm>
        </div>
      </div>
    </div>
  )

  return (
    <section className="">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <header className="mt-6 space-y-1">
          <h2 className="text-base font-semibold text-zinc-800">
            Additional Items
          </h2>
          <p className="text-sm text-zinc-500">
            Added extras · {totalExtrasCount} items
          </p>
        </header>

        <ButtonSm
          type="button"
          state="default"
          className="rounded-md border border-[#E4E4E7] px-4 py-2 text-xs font-semibold tracking-wide uppercase"
          onClick={() => setIsDrawerOpen(true)}
        >
          Add more +
        </ButtonSm>
      </header>

      {safeItems.length === 0 ? (
        <div className="border border-dashed border-[#E4E4E7] bg-[#F9F9F9] px-4 py-8 text-center text-sm text-zinc-500">
          No extras yet. Add tableware, beverages or desserts with “Add more +”.
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

export default AdditionalItemsSelector
