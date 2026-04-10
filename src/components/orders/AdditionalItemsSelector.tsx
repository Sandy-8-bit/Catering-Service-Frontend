import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Spinner from '@/components/common/Spinner'
import type { AdditionalItem } from '@/types/additionalItem'
import type { OrderAdditionalItem } from '@/types/order'
import { Minus, Plus } from 'lucide-react'
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
  const { t } = useTranslation()
  const safeItems = selectedItems || []
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>(
    {}
  )

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

  const displayItems = sortedItems

  useEffect(() => {
    setQuantityDrafts((prev) => {
      const next: Record<number, string> = {}
      safeItems.forEach((item) => {
        if (item.additionalItemId in prev) {
          next[item.additionalItemId] = prev[item.additionalItemId]
        }
      })
      return next
    })
  }, [safeItems])

  const createOrderAdditionalItem = (
    item: AdditionalItem
  ): OrderAdditionalItem => ({
    id: 0,
    additionalItemId: item.id,
    itemPrimaryName: item.primaryName,
    itemSecondaryName: item.secondaryName ?? '',
    quantity: 1,
    priceAtOrder: item.pricePerUnit ?? 0,
    lineTotal: item.pricePerUnit ?? 0,
  })

  const handleAddItem = (additionalItemId: number) => {
    const catalogItem = additionalItemMap.get(additionalItemId)
    if (!catalogItem) return

    const existing = safeItems.find(
      (item) => item.additionalItemId === additionalItemId
    )

    if (existing) {
      onChange(
        safeItems.map((item) =>
          item.additionalItemId === additionalItemId
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
      if (item.additionalItemId !== additionalItemId) {
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

  const handleQuantityInputChange = (
    additionalItemId: number,
    value: string
  ) => {
    setQuantityDrafts((prev) => ({
      ...prev,
      [additionalItemId]: value,
    }))

    if (value === '' || !/^\d+$/.test(value)) return

    const parsedQuantity = Number.parseInt(value, 10)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) return

    const nextItems = safeItems.map((item) => {
      if (item.additionalItemId !== additionalItemId) return item

      const catalogItem = additionalItemMap.get(additionalItemId)
      const unitPrice = item.priceAtOrder ?? catalogItem?.pricePerUnit ?? 0

      return {
        ...item,
        quantity: parsedQuantity,
        lineTotal: unitPrice * parsedQuantity,
      }
    })

    onChange(nextItems)
  }

  const handleQuantityInputBlur = (
    additionalItemId: number,
    currentQuantity: number
  ) => {
    const draftValue = quantityDrafts[additionalItemId]

    if (draftValue == null) return

    const parsedQuantity = Number.parseInt(draftValue, 10)
    const isValidQuantity =
      Number.isFinite(parsedQuantity) &&
      parsedQuantity >= 1 &&
      /^\d+$/.test(draftValue)

    if (!isValidQuantity) {
      setQuantityDrafts((prev) => {
        const next = { ...prev }
        delete next[additionalItemId]
        return next
      })
      return
    }

    if (parsedQuantity !== currentQuantity) {
      const nextItems = safeItems.map((item) => {
        if (item.additionalItemId !== additionalItemId) return item

        const catalogItem = additionalItemMap.get(additionalItemId)
        const unitPrice = item.priceAtOrder ?? catalogItem?.pricePerUnit ?? 0

        return {
          ...item,
          quantity: parsedQuantity,
          lineTotal: unitPrice * parsedQuantity,
        }
      })

      onChange(nextItems)
    }

    setQuantityDrafts((prev) => ({
      ...prev,
      [additionalItemId]: String(parsedQuantity),
    }))
  }

  return (
    <section className="">
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="border border-dashed border-[#E4E4E7] bg-white p-6 text-center text-xs text-zinc-500 sm:text-sm">
          {t('orders_no_items_available')}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {displayItems.map((item) => {
            const existing = safeItems.find(
              (line) => line.additionalItemId === item.id
            )
            const isSelected = Boolean(existing)
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-md border p-3 transition ${
                  isSelected
                    ? 'border-zinc-300 bg-white shadow-sm'
                    : 'border-[#E4E4E7]/50 bg-white shadow-sm hover:border-zinc-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-900 sm:text-sm">
                      {item.primaryName}
                    </p>
                    <p className="text-[10px] text-zinc-500 sm:text-xs">
                      {item.secondaryName || t('orders_perfect_pairing')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-zinc-900 sm:text-sm">
                  {formatCurrency(item.pricePerUnit)}
                </span>
                {isSelected ? (
                  <div className="flex items-center justify-between rounded-md border border-[#E4E4E7] bg-white px-2 py-1.5">
                    <button
                      type="button"
                      aria-label={t('decrease_quantity')}
                      onClick={() => handleQuantityChange(item.id, -1)}
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
                        quantityDrafts[item.id] ??
                        String(existing?.quantity ?? 1)
                      }
                      onChange={(event) =>
                        handleQuantityInputChange(item.id, event.target.value)
                      }
                      onBlur={() =>
                        handleQuantityInputBlur(
                          item.id,
                          existing?.quantity ?? 1
                        )
                      }
                      className="h-7 w-12 rounded-md border border-[#E4E4E7] text-center text-xs font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                    />
                    <button
                      type="button"
                      aria-label={t('increase_quantity')}
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-white text-zinc-700 transition hover:bg-zinc-900 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  <ButtonSm
                    type="button"
                    state="default"
                    onClick={() => handleAddItem(item.id)}
                    className="rounded-sm border border-[#E4E4E7] px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase sm:text-xs"
                  >
                    {t('add')}
                  </ButtonSm>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AdditionalItemsSelector
