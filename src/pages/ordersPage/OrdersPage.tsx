import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArrowLeft, Edit3, Plus } from 'lucide-react'
import InlineCalendar from '@/components/common/InlineCalendar'
import ButtonSm from '@/components/common/Buttons'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchOrders } from '@/queries/ordersQueries'
import type { Order } from '@/types/order'

interface SummaryListProps {
  title: string
  items: Array<{ label: string; quantity: number }>
  emptyLabel: string
}

const SummaryList = ({ title, items, emptyLabel }: SummaryListProps) => {
  return (
    <article className="">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        {items.length > 0 && (
          <span className="text-sm font-medium text-zinc-400">
            {items.length} items
          </span>
        )}
      </header>
      {items.length === 0 ? (
        <p className="flex flex-row items-center gap-2 rounded-md border-2 border-dashed border-[#f1f1f1] bg-white p-3 text-base text-zinc-500 shadow-sm">
          <Archive className="mr-2" size={18} /> {emptyLabel}
        </p>
      ) : (
        <section className="max-h-80 min-w-[100px] flex-wrap divide-slate-100 overflow-y-auto text-base text-zinc-700">
          {items.map((item) => (
            <div
              key={`${title}-${item.label}`}
              className="mr-2 mb-2 flex w-max items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
            >
              <span className="text-sm font-medium text-zinc-900 md:text-base">
                {item.label}
              </span>
              <span className="ml-4 text-base font-medium text-zinc-900">
                {item.quantity}
              </span>
            </div>
          ))}
        </section>
      )}
    </article>
  )
}

const OrderDetailsCard = ({ order }: { order: Order | null }) => {
  if (!order) {
    return <></>
  }

  const eventDate = new Date(order.eventDate)

  return (
    <article className="">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium tracking-wide text-orange-500 uppercase">
          Order Details
        </p>

        <span className="roundezinc-100 fo uppercasent-semibold px-4 py-1 text-sm text-zinc-600">
          #{order.id}
        </span>
      </header>
      <dl className="grid grid-cols-1 gap-6 text-sm text-zinc-600 md:grid-cols-2">
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <dt className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Customer
          </dt>
          <dd className="text-base font-semibold text-zinc-900">
            {order.customerName}
          </dd>
          <p className="text-sm text-zinc-500">{order.customerPhone}</p>
        </div>
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <dt className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Event
          </dt>
          <dd className="text-base font-semibold text-zinc-900">
            {order.eventType}
          </dd>
          <p className="text-sm text-zinc-500">
            {eventDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
            ,{' '}
            {eventDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <dt className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Headcount
          </dt>
          <dd className="text-base font-semibold text-zinc-900">
            {order.totalPeople} guests
          </dd>
        </div>
        <div className="space-y-1 border-t border-slate-100 pt-4">
          <dt className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            Payment
          </dt>
          <dd className="text-base font-semibold text-zinc-900">
            {order.paymentType}
          </dd>
          <p className="text-sm text-zinc-500">
            Advance ₹{order.advanceAmount.toLocaleString()} / Balance ₹
            {/* {order.balanceAmount.toLocaleString()} */}
          </p>
        </div>
      </dl>
    </article>
  )
}

const isSameDay = (first: Date, second: Date) => {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

const getProductDisplayName = (
  product: Order['items'][number]['product']
): string => {
  return (
    product?.productPrimaryName ||
    product?.primaryName ||
    product?.productSecondaryName ||
    product?.secondaryName ||
    ''
  )
}

const buildQuantitySummary = <T,>(
  orders: Order[],
  getItems: (order: Order) => T[],
  getLabel: (item: T) => string,
  getQuantity: (item: T) => number
) => {
  const map = new Map<string, number>()
  orders.forEach((order) => {
    getItems(order).forEach((item) => {
      const label = getLabel(item)
      if (!label) return
      map.set(label, (map.get(label) ?? 0) + getQuantity(item))
    })
  })
  return Array.from(map.entries()).map(([label, quantity]) => ({
    label,
    quantity,
  }))
}

const detailSectionTitleClass =
  'text-md font-semibold uppercase tracking-[0.2em] text-orange-500'

export const OrdersPage = () => {
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const { data: orders = [], isLoading } = useFetchOrders({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth() + 1,
  })

  const ordersPerDate = useMemo(() => {
    const counts: Record<string, number> = {}
    orders.forEach((order) => {
      if (!order.eventDate) return
      const key = order.eventDate.split('T')[0]
      if (!key) return
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, [orders])

  const ordersForDate = useMemo(() => {
    return orders
      .filter((order) => {
        if (!order.eventDate) return false
        const eventDate = new Date(order.eventDate)
        return isSameDay(eventDate, selectedDate)
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
  }, [orders, selectedDate])

  useEffect(() => {
    if (!selectedOrderId) return
    const stillExists = ordersForDate.some(
      (order) => order.id === selectedOrderId
    )
    if (!stillExists) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrderId(null)
    }
  }, [ordersForDate, selectedOrderId])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return ordersForDate.find((order) => order.id === selectedOrderId) ?? null
  }, [ordersForDate, selectedOrderId])

  const sourceOrders = selectedOrder ? [selectedOrder] : ordersForDate

  const itemsSummary = useMemo(
    () =>
      buildQuantitySummary(
        sourceOrders,
        (order) => order.items,
        (item) => getProductDisplayName(item.product) || `Item ${item.id}`,
        (item) => item.quantity
      ),
    [sourceOrders]
  )

  const additionalItemsSummary = useMemo(
    () =>
      buildQuantitySummary(
        sourceOrders,
        (order) => order.additionalItems,
        (item) =>
          item.additionalItem?.additionalItemPrimaryName ||
          `Additional ${item.id}`,
        (item) => item.quantity
      ),
    [sourceOrders]
  )

  const infoMessage = isLoading
    ? 'Loading orders…'
    : ordersForDate.length === 0
      ? 'No orders scheduled for this date.'
      : null

  const formattedDateLabel = selectedDate.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const handleNavigateToForm = (
    mode: 'create' | 'edit',
    orderId?: number | null
  ) => {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (mode === 'edit' && orderId) {
      params.set('orderId', String(orderId))
    }
    navigate(`${appRoutes.ordersForm.path}?${params.toString()}`)
  }

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-col items-center gap-2 px-4 py-2 sm:flex-row sm:justify-between">
        <div>
          <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
            Orders
          </h1>
        </div>
        <div className="flex flex-row items-center gap-3">
          {selectedOrder && (
            <ButtonSm
              state="outline"
              disabled={!selectedOrderId}
              onClick={() => handleNavigateToForm('edit', selectedOrderId)}
              className="font-medium"
            >
              <Edit3 className="mr-2 h-4 w-4 text-black" /> Edit Order
            </ButtonSm>
          )}
          <ButtonSm
            state="default"
            onClick={() => handleNavigateToForm('create')}
            className="font-medium"
          >
            <Plus className="mr-2 h-4 w-4 text-white" /> Add New Order
          </ButtonSm>
        </div>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="mt-6 flex flex-col gap-6 px-4 pb-6 lg:flex-row">
        <div
          className="flex w-full flex-col gap-6 lg:w-auto"
          style={{ zoom: 0.95 }}
        >
          <InlineCalendar
            className="min-w-[360px]!"
            showSelectedLabel={false}
            selectedDate={selectedDate}
            dateCounts={ordersPerDate}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setSelectedOrderId(null)
            }}
          />

          <div className="rounded-2xl border-2 border-[#F1F1F1] p-5">
            <header className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                  Orders on
                </p>
                <h3 className="text-lg font-semibold text-zinc-900">
                  {formattedDateLabel}
                </h3>
              </div>
              {ordersForDate.length > 0 && (
                <span className="rounded-full bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600">
                  {ordersForDate.length} total
                </span>
              )}
            </header>

            <div className="mt-4 flex flex-col gap-3">
              {infoMessage ? (
                <p className="rounded-md border-2 border-dashed border-[#f1f1f1] p-3 text-base text-zinc-500">
                  {infoMessage}
                </p>
              ) : (
                ordersForDate.map((order) => {
                  const isActive = order.id === selectedOrderId
                  return (
                    <button
                      type="button"
                      key={order.id}
                      onClick={() =>
                        setSelectedOrderId((prev) =>
                          prev === order.id ? null : order.id
                        )
                      }
                      className={`w-full cursor-pointer rounded-2xl px-4 py-3 text-left text-base transition ${
                        isActive
                          ? 'border border-orange-300 bg-orange-100 text-zinc-900'
                          : 'border border-[#f1f1f1] bg-white hover:border-zinc-200'
                      }`}
                    >
                      <p className="text-lg font-semibold">
                        {order.customerName}
                      </p>
                      <span className="text-sm text-zinc-500">
                        #{order.id} · {order.eventType}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 rounded-2xl border-2 border-[#F1F1F1] bg-white p-5">
          <div className="flex flex-col items-start gap-1">
            {selectedOrder && (
              <ArrowLeft
                className="cursor-pointer text-orange-500"
                onClick={() => {
                  setSelectedOrderId(null)
                }}
                size={14}
              />
            )}
            <p className={detailSectionTitleClass}> Summary</p>
            <p className="text-lg font-semibold text-zinc-900">
              {selectedOrder
                ? selectedOrder.customerName
                : 'Overall Orders for the Day'}
            </p>
          </div>

          <SummaryList
            title={selectedOrder ? 'Items in this order' : 'Items required'}
            items={itemsSummary}
            emptyLabel={
              selectedOrder
                ? 'No menu items added to this order.'
                : 'No items planned for this date.'
            }
          />

          <SummaryList
            title={
              selectedOrder
                ? 'Additional items in this order'
                : 'Additional items required'
            }
            items={additionalItemsSummary}
            emptyLabel={
              selectedOrder
                ? 'No additional items attached to this order.'
                : 'No additional items planned for this date.'
            }
          />

          <OrderDetailsCard order={selectedOrder} />
        </div>
      </section>
    </main>
  )
}
