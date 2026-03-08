import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Archive, ArrowLeft, Edit3, Mic, Plus } from 'lucide-react'
import InlineCalendar from '@/components/common/InlineCalendar'
import ButtonSm from '@/components/common/Buttons'
import GenericTable from '@/components/common/GenericTable'
import DialogBox from '@/components/common/DialogBox'
import VoiceOrderDialog from '@/components/orders/VoiceOrderDialog'
import DownloadBillButton from '@/components/orders/DownloadBillButton'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchOrders } from '@/queries/ordersQueries'
import type { Order, RequiredSubProduct } from '@/types/order'

const DetailCell = ({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) => (
  <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200">
    <p className="mb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
      {label}
    </p>
    <p className="text-base leading-snug font-bold text-zinc-900">{value}</p>
  </div>
)

const OrderDetailsCard = ({ order }: { order: Order | null }) => {
  const { t } = useTranslation()

  if (!order) {
    return <></>
  }

  const eventDate = new Date(order.eventDate)

  return (
    <article className="overflow-hidden rounded-xl border-2 border-zinc-200/80 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">
            {t('order_details')}
          </p>
        </div>
        <span className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-bold tracking-wide text-white">
          #{order.id}
        </span>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCell label={t('customer')} value={order.customerName} />
          <DetailCell label={t('phone')} value={order.customerPhone} />
          <DetailCell label={t('event')} value={order.eventType} />
          <DetailCell
            label={t('date_time')}
            value={
              <span>
                {eventDate.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {' | '}
                <span className="">
                  {eventDate.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            }
          />
          <DetailCell
            label={t('headcount')}
            value={
              <span>
                {order.totalPeople}{' '}
                <span className="text-sm font-normal text-zinc-400">
                  {t('guests')}
                </span>
              </span>
            }
          />
          <DetailCell label={t('payment')} value={order.paymentType} />
          <DetailCell
            label={t('advance')}
            value={`₹${order.advanceAmount.toLocaleString()}`}
          />
          <DetailCell
            label={t('balance')}
            value={`₹${order.balanceAmount.toLocaleString()}`}
          />
        </dl>
      </div>
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

const getProductDisplayName = (item: Order['items'][number]): string => {
  return (
    item?.productPrimaryName ||
    item?.product?.productPrimaryName ||
    item?.product?.primaryName ||
    item?.productSecondaryName ||
    item?.product?.productSecondaryName ||
    item?.product?.secondaryName ||
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
  'text-xs font-bold uppercase tracking-[0.2em] text-orange-500'

export const OrdersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [showVoiceDialog, setShowVoiceDialog] = useState(false)

  const selectedDateISO = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD

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
        (item) => getProductDisplayName(item),
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
          item?.itemPrimaryName ||
          item?.itemSecondaryName ||
          t('additional_item_with_id', { id: item?.id }),
        (item) => item.quantity
      ),
    [sourceOrders, t]
  )

  const subProductsSummary = useMemo(() => {
    const map = new Map<string, RequiredSubProduct>()
    sourceOrders.forEach((order) => {
      ;(order.requiredSubProducts ?? []).forEach((sp) => {
        if (!sp.subProductName) return
        const key = `${sp.subProductName}||${sp.unit}`
        const existing = map.get(key)
        if (existing) {
          map.set(key, {
            ...existing,
            requiredQuantity: existing.requiredQuantity + sp.requiredQuantity,
          })
        } else {
          map.set(key, {
            subProductName: sp.subProductName,
            requiredQuantity: sp.requiredQuantity,
            unit: sp.unit,
          })
        }
      })
    })
    return Array.from(map.values())
  }, [sourceOrders])

  const infoMessage =
    !isLoading && ordersForDate.length === 0 ? t('no_orders_scheduled') : null

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
    <main className="layout-container flex min-h-[95vh] flex-col overflow-hidden rounded-[12px] border border-zinc-200 bg-zinc-50 shadow-sm">
      <header className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-orange-500" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {t('orders')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedOrder && (
            <>
              <ButtonSm
                state="outline"
                disabled={!selectedOrderId}
                onClick={() => handleNavigateToForm('edit', selectedOrderId)}
                className="hidden font-medium lg:flex"
              >
                <Edit3 className="mr-2 h-4 w-4 text-black" /> {t('edit_order')}
              </ButtonSm>
              <div className="hidden lg:block">
                <DownloadBillButton orderId={selectedOrder.id} />
              </div>
            </>
          )}
          {selectedOrder && (
            <>
              <ButtonSm
                state="outline"
                disabled={!selectedOrderId}
                onClick={() => navigate(`/driver/order/${selectedOrder.id}`)}
                className="hidden font-medium lg:flex"
              >
                <Edit3 className="mr-2 h-4 w-4 text-black" />{' '}
                {t('update_status')}
              </ButtonSm>
            </>
          )}
          <ButtonSm
            state="outline"
            onClick={() => setShowVoiceDialog(true)}
            className="font-medium"
          >
            <Mic className="mr-2 h-4 w-4 text-zinc-700" />{' '}
            {t('create_voice_order')}
          </ButtonSm>
          <ButtonSm
            state="default"
            onClick={() => handleNavigateToForm('create')}
            className="font-medium"
          >
            <Plus className="mr-2 h-4 w-4 text-white" /> {t('add_new_order')}
          </ButtonSm>
        </div>
      </header>

      {showVoiceDialog && (
        <DialogBox setToggleDialogueBox={setShowVoiceDialog} width="420px">
          <VoiceOrderDialog
            onClose={() => setShowVoiceDialog(false)}
            eventDate={selectedDateISO}
          />
        </DialogBox>
      )}

      <section className="flex flex-1 flex-col gap-0 overflow-hidden lg:flex-row">
        <div className="flex w-full flex-col gap-5 border-b border-zinc-200 bg-zinc-50 p-4 lg:w-[360px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
          <InlineCalendar
            className="min-w-full!"
            showSelectedLabel={false}
            selectedDate={selectedDate}
            dateCounts={ordersPerDate}
            isLoading={isLoading}
            onSelectDate={(date) => {
              setSelectedDate(date)
              setSelectedOrderId(null)
            }}
          />

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <header className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
                  {t('orders_on')}
                </p>
                <h3 className="text-base font-bold text-zinc-900">
                  {formattedDateLabel}
                </h3>
              </div>
              {ordersForDate.length > 0 && (
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500 ring-1 ring-orange-200">
                  {ordersForDate.length} {t('total')}
                </span>
              )}
            </header>

            <div className="flex max-h-52 flex-col gap-2 overflow-y-auto sm:max-h-[300px]">
              {isLoading ? (
                <div className="flex animate-pulse flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={`order-skel-${i}`}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                      <div className="mb-2 h-4 w-2/3 rounded bg-zinc-200" />
                      <div className="h-3 w-1/3 rounded bg-zinc-100" />
                    </div>
                  ))}
                </div>
              ) : infoMessage ? (
                <p className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-sm text-zinc-400">
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
                      className={`w-full cursor-pointer rounded-xl px-4 py-3 text-left transition-all ${
                        isActive
                          ? 'bg-orange-500 shadow-md shadow-orange-200'
                          : 'border border-zinc-100 bg-zinc-50 hover:bg-zinc-100'
                      }`}
                    >
                      <p
                        className={`text-base font-bold ${isActive ? 'text-white' : 'text-zinc-800'}`}
                      >
                        {order.customerName}
                      </p>
                      <span
                        className={`text-xs ${isActive ? 'text-orange-100' : 'text-zinc-400'}`}
                      >
                        #{order.id} · {order.eventType}
                      </span>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:hidden">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigateToForm('edit', order.id)
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          }`}
                        >
                          <Edit3 className="h-3 w-3" />
                          {t('edit_order')}
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                          <DownloadBillButton orderId={order.id} compact />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/driver/order/${order.id}`)
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {t('update_status')}
                        </button>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 overflow-y-auto bg-white p-4 shadow-[-1px_0_0_0_#e4e4e7] sm:p-6">
          <div className="flex flex-col items-start gap-1">
            {selectedOrder ? (
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600"
              >
                <ArrowLeft size={12} /> {t('back_to_day_view')}
              </button>
            ) : (
              <>
                <p className={detailSectionTitleClass}>{t('summary')}</p>
                <p className="text-xl font-bold text-zinc-900">
                  {t('overview_for_day')}
                </p>
              </>
            )}
          </div>

          {selectedOrder && <OrderDetailsCard order={selectedOrder} />}

          <div className="flex flex-col gap-10 overflow-hidden">
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-orange-500" />
                <h3 className="text-base font-bold text-zinc-900">
                  {selectedOrder ? t('items_in_order') : t('items_required')}
                </h3>
              </div>
              <div className="w-full overflow-x-auto">
                {selectedOrder ? (
                  selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <GenericTable
                      data={selectedOrder.items}
                      dataCell={[
                        {
                          headingTitle: t('primary_name'),
                          accessVar: 'productPrimaryName',
                        },
                        {
                          headingTitle: t('secondary_name'),
                          accessVar: 'productSecondaryName',
                        },
                        {
                          headingTitle: t('quantity'),
                          accessVar: 'quantity',
                          render: (value) => (
                            <span className="font-semibold text-zinc-900">
                              {value}
                            </span>
                          ),
                        },
                        {
                          headingTitle: t('total_price'),
                          accessVar: 'totalPrice',
                          render: (value) => (
                            <span className="font-semibold text-zinc-900">
                              ₹{value?.toLocaleString()}
                            </span>
                          ),
                        },
                      ]}
                      isHeaderVisible={true}
                      messageWhenNoData={t('no_menu_items_order')}
                    />
                  ) : (
                    <p className="flex flex-row items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-400">
                      <Archive size={16} className="shrink-0 text-zinc-300" />{' '}
                      {t('no_menu_items_order')}
                    </p>
                  )
                ) : itemsSummary.length > 0 ? (
                  <GenericTable
                    data={itemsSummary.map((item) => ({
                      productPrimaryName: item.label,
                      quantity: item.quantity,
                    }))}
                    dataCell={[
                      {
                        headingTitle: t('item_name'),
                        accessVar: 'productPrimaryName',
                      },
                      {
                        headingTitle: t('quantity'),
                        accessVar: 'quantity',
                        render: (value) => (
                          <span className="font-semibold text-zinc-900">
                            {value}
                          </span>
                        ),
                      },
                    ]}
                    isHeaderVisible={true}
                    messageWhenNoData={t('no_items_planned')}
                  />
                ) : (
                  <p className="flex flex-row items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-400">
                    <Archive size={16} className="shrink-0 text-zinc-300" />{' '}
                    {t('no_items_planned')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-orange-500" />
                <h3 className="text-base font-bold text-zinc-900">
                  {selectedOrder
                    ? t('sub_products_in_order')
                    : t('sub_products_required')}
                </h3>
              </div>
              <div className="w-full overflow-x-auto">
                {subProductsSummary.length > 0 ? (
                  <GenericTable
                    data={subProductsSummary}
                    dataCell={[
                      {
                        headingTitle: t('sub_product_name'),
                        accessVar: 'subProductName',
                      },
                      {
                        headingTitle: t('required_quantity'),
                        accessVar: 'requiredQuantity',
                        render: (value) => (
                          <span className="font-semibold text-zinc-900">
                            {value}
                          </span>
                        ),
                      },
                      {
                        headingTitle: t('unit'),
                        accessVar: 'unit',
                      },
                    ]}
                    isHeaderVisible={true}
                    messageWhenNoData={
                      selectedOrder
                        ? t('no_sub_products_order')
                        : t('no_sub_products_planned')
                    }
                  />
                ) : (
                  <p className="flex flex-row items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-400">
                    <Archive size={16} className="shrink-0 text-zinc-300" />{' '}
                    {selectedOrder
                      ? t('no_sub_products_order')
                      : t('no_sub_products_planned')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="h-4 w-0.5 rounded-full bg-orange-500" />
                <h3 className="text-base font-bold text-zinc-900">
                  {selectedOrder
                    ? t('additional_items_in_order')
                    : t('additional_items_required')}
                </h3>
              </div>
              <div className="w-full overflow-x-auto">
                {selectedOrder ? (
                  selectedOrder.additionalItems &&
                  selectedOrder.additionalItems.length > 0 ? (
                    <GenericTable
                      data={selectedOrder.additionalItems}
                      dataCell={[
                        {
                          headingTitle: t('primary_name'),
                          accessVar: 'itemPrimaryName',
                        },
                        {
                          headingTitle: t('secondary_name'),
                          accessVar: 'itemSecondaryName',
                        },
                        {
                          headingTitle: t('quantity'),
                          accessVar: 'quantity',
                          render: (value) => (
                            <span className="font-semibold text-zinc-900">
                              {value}
                            </span>
                          ),
                        },
                        {
                          headingTitle: t('total_price'),
                          accessVar: 'totalPrice',
                          render: (value) => (
                            <span className="font-semibold text-zinc-900">
                              ₹{value?.toLocaleString()}
                            </span>
                          ),
                        },
                      ]}
                      isHeaderVisible={true}
                      messageWhenNoData={t('no_additional_items_order')}
                    />
                  ) : (
                    <p className="flex flex-row items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-400">
                      <Archive size={16} className="shrink-0 text-zinc-300" />{' '}
                      {t('no_additional_items_order')}
                    </p>
                  )
                ) : additionalItemsSummary.length > 0 ? (
                  <GenericTable
                    data={additionalItemsSummary.map((item) => ({
                      itemPrimaryName: item.label,
                      quantity: item.quantity,
                    }))}
                    dataCell={[
                      {
                        headingTitle: t('item_name'),
                        accessVar: 'itemPrimaryName',
                      },
                      {
                        headingTitle: t('quantity'),
                        accessVar: 'quantity',
                        render: (value) => (
                          <span className="font-semibold text-zinc-900">
                            {value}
                          </span>
                        ),
                      },
                    ]}
                    isHeaderVisible={true}
                    messageWhenNoData={t('no_additional_items_planned')}
                  />
                ) : (
                  <p className="flex flex-row items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-400">
                    <Archive size={16} className="shrink-0 text-zinc-300" />{' '}
                    {t('no_additional_items_planned')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
