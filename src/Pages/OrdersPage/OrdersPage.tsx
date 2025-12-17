import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, Plus } from 'lucide-react'
import InlineCalendar from '@/components/common/InlineCalendar'
import ButtonSm from '@/components/common/Buttons'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchOrders } from '@/queries/OrdersQueries'
import type { Order } from '@/types/Order'

interface SummaryListProps {
  title: string
  items: Array<{ label: string; quantity: number }>
  emptyLabel: string
}

const SummaryList = ({ title, items, emptyLabel }: SummaryListProps) => {
  return (
    <article className="rounded-2xl border border-[#F1F1F1] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-800">{title}</h3>
        {items.length > 0 && (
          <span className="text-xs font-medium text-zinc-400">
            {items.length} items
          </span>
        )}
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 text-sm text-zinc-700">
          {items.map((item) => (
            <li
              key={`${title}-${item.label}`}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2"
            >
              <span className="truncate font-medium text-zinc-800">
                {item.label}
              </span>
              <span className="ml-3 shrink-0 font-semibold text-zinc-900">
                {item.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

const OrderDetailsCard = ({ order }: { order: Order | null }) => {
  if (!order) {
    return (
      <article className="rounded-2xl border border-dashed border-[#F1F1F1] bg-white p-4 text-sm text-zinc-500">
        Select an order from the list to view detailed customer and delivery
        information.
      </article>
    )
  }

  const eventDate = new Date(order.eventDateTime)

  return (
    <article className="rounded-2xl border border-[#F1F1F1] bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between text-base font-semibold text-zinc-800">
        Order Details
        <span className="text-xs font-medium text-zinc-500">#{order.id}</span>
      </header>
      <dl className="grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
        <div>
          <dt className="text-xs tracking-wide text-zinc-400 uppercase">
            Customer
          </dt>
          <dd className="font-medium text-zinc-900">{order.customerName}</dd>
          <p className="text-xs text-zinc-500">{order.customerPhone}</p>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-zinc-400 uppercase">
            Event
          </dt>
          <dd className="font-medium text-zinc-900">{order.eventType}</dd>
          <p className="text-xs text-zinc-500">
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
        <div>
          <dt className="text-xs tracking-wide text-zinc-400 uppercase">
            Headcount
          </dt>
          <dd className="font-medium text-zinc-900">
            {order.totalPeople} guests
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-zinc-400 uppercase">
            Payment
          </dt>
          <dd className="font-medium text-zinc-900">{order.paymentType}</dd>
          <p className="text-xs text-zinc-500">
            Advance ₹{order.advanceAmount.toLocaleString()} / Balance ₹
            {order.balanceAmount.toLocaleString()}
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

export const OrdersPage = () => {
  const navigate = useNavigate()
  const { data: orders = [], isLoading } = useFetchOrders()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const ordersForDate = useMemo(() => {
    return orders
      .filter((order) => {
        if (!order.eventDateTime) return false
        const eventDate = new Date(order.eventDateTime)
        return isSameDay(eventDate, selectedDate)
      })
      .sort(
        (a, b) =>
          new Date(a.eventDateTime).getTime() -
          new Date(b.eventDateTime).getTime()
      )
  }, [orders, selectedDate])

  useEffect(() => {
    setSelectedOrderId((prev) => {
      if (!prev) return null
      const exists = ordersForDate.some((order) => order.id === prev)
      return exists ? prev : null
    })
  }, [ordersForDate])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return ordersForDate.find((order) => order.id === selectedOrderId) ?? null
  }, [ordersForDate, selectedOrderId])

  const sourceOrders = selectedOrder ? [selectedOrder] : ordersForDate

  const itemsSummary = useMemo(() => {
    const map = new Map<string, number>()
    sourceOrders.forEach((order) => {
      order.items.forEach((item) => {
        const label = item.product.productPrimaryName || `Item ${item.id}`
        map.set(label, (map.get(label) ?? 0) + item.quantity)
      })
    })
    return Array.from(map.entries()).map(([label, quantity]) => ({
      label,
      quantity,
    }))
  }, [sourceOrders])

  const additionalItemsSummary = useMemo(() => {
    const map = new Map<string, number>()
    sourceOrders.forEach((order) => {
      order.additionalItems.forEach((item) => {
        const label =
          item.additionalItem.additionalItemPrimaryName ||
          `Additional ${item.id}`
        map.set(label, (map.get(label) ?? 0) + item.quantity)
      })
    })
    return Array.from(map.entries()).map(([label, quantity]) => ({
      label,
      quantity,
    }))
  }, [sourceOrders])

  const infoMessage = useMemo(() => {
    if (isLoading) return 'Loading orders…'
    if (ordersForDate.length === 0) return 'No orders scheduled for this date.'
    return null
  }, [isLoading, ordersForDate.length])

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
      <header className="flex flex-row gap-4 p-4">
        <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
          Orders
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-800">Pick a date</h2>
          <p className="text-sm text-zinc-500">
            Use the calendar to filter and aggregate daily production.
          </p>
        </div>
        <div className="flex flex-row items-center gap-3">
          <ButtonSm
            state="outline"
            disabled={!selectedOrderId}
            onClick={() => handleNavigateToForm('edit', selectedOrderId)}
            className="font-medium"
          >
            <Edit3 className="mr-2 h-4 w-4 text-black" /> Edit Order
          </ButtonSm>
          <ButtonSm
            state="default"
            onClick={() => handleNavigateToForm('create')}
            className="font-medium"
          >
            <Plus className="mr-2 h-4 w-4 text-white" /> Add New Order
          </ButtonSm>
        </div>
      </section>

      <section className="grid gap-6 p-6 lg:grid-cols-[360px,1fr]">
        <div className="flex flex-col gap-5" style={{ zoom: 0.9 }}>
          <InlineCalendar
            className="w-full"
            showSelectedLabel={false}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setSelectedOrderId(null)
            }}
          />

          <div className="rounded-2xl border border-[#F1F1F1] bg-white p-4 shadow-sm">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-wide text-zinc-400 uppercase">
                  Orders on
                </p>
                <h3 className="text-base font-semibold text-zinc-800">
                  {formattedDateLabel}
                </h3>
              </div>
              {ordersForDate.length > 0 && (
                <span className="text-xs font-medium text-zinc-500">
                  {ordersForDate.length} total
                </span>
              )}
            </header>

            <div className="mt-3 space-y-2">
              {infoMessage ? (
                <p className="text-sm text-zinc-500">{infoMessage}</p>
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
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${(isActive && 'border-[#4F46E5] bg-[#4F46E5]/5 text-[#1F1F21]') || 'border-[#F1F1F1] hover:border-zinc-200'}`}
                    >
                      <p className="font-semibold text-zinc-800">
                        {order.customerName}
                      </p>
                      <span className="text-xs text-zinc-500">
                        #{order.id} · {order.eventType}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
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
