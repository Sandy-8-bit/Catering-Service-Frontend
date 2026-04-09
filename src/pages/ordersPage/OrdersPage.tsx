import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Archive,
  ArrowLeft,
  Edit3,
  Mic,
  Plus,
  Trash2,
  X,
  ChevronDown,
} from 'lucide-react'
import InlineCalendar from '@/components/common/InlineCalendar'
import ButtonSm from '@/components/common/Buttons'
import GenericTable from '@/components/common/GenericTable'
import DialogBox from '@/components/common/DialogBox'
import VoiceOrderDialog from '@/components/orders/VoiceOrderDialog'
import DownloadBillButton from '@/components/orders/DownloadBillButton'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchOrders, useDeleteOrder } from '@/queries/ordersQueries'
import type { Order } from '@/types/order'
import toast from 'react-hot-toast'

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

  const formatTime = (time: string) => {
  const [hour, minute] = time.split(':');

  return new Date(0, 0, 0, +hour, +minute).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied!');
};
  
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
       <DetailCell
  label={t('customer')}
  value={
    <span
      className="cursor-pointer hover:text-blue-500"
      onClick={() => handleCopy(order.customerName)}
    >
      {order.customerName}
    </span>
  }
/>

<DetailCell
  label={t('phone')}
  value={
    <span
      className="cursor-pointer hover:text-blue-500"
      onClick={() => handleCopy(order.customerPhone)}
    >
      {order.customerPhone}
    </span>
  }
/>
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
                  {formatTime(order.eventTime)}
                </span>
              </span>
            }
          />
          <DetailCell
            label={t('headcount')}
            value={
              <span>
                {order.totalPlates}{' '}
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

const getAdditionalMenuItemDisplayName = (
  item: NonNullable<Order['additionalMenuItems']>[number]
): string => {
  return (
    item?.productPrimaryName ||
    item?.productSecondaryName ||
    item?.productId?.toString() ||
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

interface ActionDropdownProps {
  actions: Array<{
    id: string
    label: string
    icon: React.ReactNode
    color?: string
    onClick: () => void
  }>
  disabled?: boolean
}

const ActionDropdown = ({ actions, disabled = false }: ActionDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex cursor-pointer flex-row items-center gap-2 rounded-[9px] border-2 border-[#F1F1F1] bg-white px-3 py-1.5 text-[12px] font-semibold text-black shadow-sm outline-0 transition-colors duration-200 select-none hover:bg-gray-100 active:bg-gray-200 lg:py-3 lg:text-sm ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        Actions
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-40 mt-1.5 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-zinc-100">
            <p className="border-b border-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              Actions
            </p>
            <ul className="py-1">
              {actions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    onClick={() => {
                      action.onClick()
                      setIsOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-orange-50 ${action.color || 'text-zinc-900'}`}
                  >
                    <span
                      className={
                        action.color === 'text-red-600'
                          ? 'text-red-600'
                          : 'text-orange-500'
                      }
                    >
                      {action.icon}
                    </span>
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

export const OrdersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { mutateAsync: deleteOrder, isPending: isDeletePending } =
    useDeleteOrder()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [showVoiceDialog, setShowVoiceDialog] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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

  const menuItemsSubtotal = useMemo(() => {
    if (selectedOrder) {
      const unitPriceSum =
        selectedOrder.items?.reduce((sum, item) => {
          const unitPrice =
            item.unitPrice ||
            (item.quantity > 0 ? item.totalPrice / item.quantity : 0)
          return sum + unitPrice
        }, 0) || 0
      return Math.round((selectedOrder.totalPlates || 1) * unitPriceSum)
    }
    return 0
  }, [selectedOrder])

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

  const additionalMenuItemsSummary = useMemo(
    () =>
      buildQuantitySummary(
        sourceOrders,
        (order) => order.additionalMenuItems ?? [],
        (item) =>
          getAdditionalMenuItemDisplayName(item) ||
          t('additional_item_with_id', { id: item?.productId }),
        (item) => item.quantity
      ),
    [sourceOrders, t]
  )

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
    } else if (mode === 'create') {
      // Pass selected date for create mode
      params.set('selectedDate', selectedDateISO)
      // Mark as new order to clear localStorage
      params.set('new', 'true')
    }
    navigate(`${appRoutes.ordersForm.path}?${params.toString()}`)
  }

  const staffUserId = localStorage.getItem('CATERING_USER_ID')

  const handleNavigateToPendingOrders = () => {
    if (!staffUserId) return
    navigate(`/driver/pending-orders/${staffUserId}`)
  }

  const handleDeleteOrder = async () => {
    if (!selectedOrderId) return
    try {
      await deleteOrder(selectedOrderId)
      setSelectedOrderId(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error(error)
    }
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
            <ActionDropdown
              actions={[
                {
                  id: 'edit',
                  label: 'Edit Order',
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => handleNavigateToForm('edit', selectedOrderId),
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  color: 'text-red-600',
                  onClick: () => setIsDeleteDialogOpen(true),
                },
                {
                  id: 'status',
                  label: 'Update Status',
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => navigate(`/driver/order/${selectedOrder.id}`),
                },
              ]}
              disabled={!selectedOrderId}
            />
          )}
          {selectedOrder && (
            <div className="hidden lg:block">
              <DownloadBillButton orderId={selectedOrder.id} />
            </div>
          )}
          <ButtonSm
            state="outline"
            onClick={() => setShowVoiceDialog(true)}
            className="font-medium lg:flex"
          >
            <Mic className="mr-2 h-4 w-4 text-zinc-700" />{' '}
            {t('create_voice_order')}
          </ButtonSm>
          <ButtonSm
            state="outline"
            onClick={handleNavigateToPendingOrders}
            disabled={!staffUserId}
            className="hidden font-medium lg:flex"
          >
            {t('pending_order')}
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

      <section className="flex max-h-full flex-1 flex-col gap-0 overflow-hidden lg:flex-row">
        {/* left section */}
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

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
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

            <div className="flex max-h-52 flex-col gap-2 overflow-x-scroll">
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
                      <div className="flex items-start justify-between gap-2">
                        <div>
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
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 lg:hidden">
                          <ActionDropdown
                            actions={[
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: <Edit3 className="h-3 w-3" />,
                                onClick: () =>
                                  handleNavigateToForm('edit', order.id),
                              },
                              {
                                id: 'delete',
                                label: 'Delete',
                                icon: <Trash2 className="h-3 w-3" />,
                                color: 'text-red-600',
                                onClick: () => {
                                  setSelectedOrderId(order.id)
                                  setIsDeleteDialogOpen(true)
                                },
                              },
                              {
                                id: 'status',
                                label: 'Status',
                                icon: <Edit3 className="h-3 w-3" />,
                                onClick: () =>
                                  navigate(`/driver/order/${order.id}`),
                              },
                            ]}
                          />
                          <div onClick={(e) => e.stopPropagation()}>
                            <DownloadBillButton orderId={order.id} compact />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
        {/* right section */}
        <div className="flex w-full flex-col gap-6 overflow-hidden bg-white p-4 shadow-[-1px_0_0_0_#e4e4e7] sm:p-6">
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

          <div className="flex min-h-0 flex-1 flex-col gap-10 overflow-y-auto">
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
                    <>
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
                      <div className="mt-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-sm font-semibold text-zinc-700">
                          {t('menu_items_subtotal')}
                        </p>
                        <p className="text-lg font-bold text-zinc-900">
                          ₹{menuItemsSubtotal.toLocaleString()}
                        </p>
                      </div>
                    </>
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
                  Additional Menu Items
                </h3>
              </div>
              <div className="w-full overflow-x-auto">
                {selectedOrder ? (
                  selectedOrder.additionalMenuItems &&
                  selectedOrder.additionalMenuItems.length > 0 ? (
                    <GenericTable
                      data={selectedOrder.additionalMenuItems}
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
                              ₹{value?.toLocaleString?.() ?? 0}
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
                  )
                ) : additionalMenuItemsSummary.length > 0 ? (
                  <GenericTable
                    data={additionalMenuItemsSummary.map((item) => ({
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

      {isDeleteDialogOpen && selectedOrder && (
        <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
          <form
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleDeleteOrder()
            }}
          >
            <header className="flex w-full items-center justify-between text-lg font-semibold text-red-600">
              Delete Order
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-600">
                Are you sure you want to delete order{' '}
                <span className="font-bold">#{selectedOrder.id}</span> for{' '}
                <span className="font-bold">{selectedOrder.customerName}</span>?
              </p>
              <p className="text-xs text-zinc-400">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex w-full gap-3">
              <ButtonSm
                type="button"
                state="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletePending}
                className="flex-1"
              >
                Cancel
              </ButtonSm>
              <ButtonSm
                type="submit"
                state="default"
                disabled={isDeletePending}
                isPending={isDeletePending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </ButtonSm>
            </div>
          </form>
        </DialogBox>
      )}
    </main>
  )
}
