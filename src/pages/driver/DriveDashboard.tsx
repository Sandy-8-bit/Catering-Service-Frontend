import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useFetchDriverDashboard } from '@/queries/driverQueries'
import type {
  AssignedOrder,
  ReturnableItem,
  DriverDashboard,
  Vessel,
} from '@/types/driverDash'
import {
  Calendar,
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

const DriverDashboardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const driverId = Number(id)

  const [date, setDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )

  const { data, isLoading, isError } = useFetchDriverDashboard({
    driverId,
    date,
  })

  const dashboardData = data as DriverDashboard | undefined
  const assignedOrders: AssignedOrder[] = dashboardData?.assignedOrders ?? []
  const returnableItems: ReturnableItem[] = dashboardData?.returnableItems ?? []

  const handleOrderClick = (orderId: number) => {
    navigate(`/driver/order/${orderId}`)
  }

  const handleLocationClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(url, '_blank')
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-base font-semibold tracking-tight text-zinc-900">
            Driver Dashboard
          </h1>
          <div className="relative mt-2.5">
            <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-4 pl-9 text-sm font-medium text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
              <p className="text-xs text-zinc-500">Loading...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              Failed to load data
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              Please try again later
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex flex-col gap-6">
            {/* ── Assigned Orders ── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">
                  Today's Deliveries
                </h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {assignedOrders.length}{' '}
                  {assignedOrders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>

              {assignedOrders.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-10 text-center">
                  <Package className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                  <p className="text-sm text-zinc-400">
                    No deliveries scheduled
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {assignedOrders.map((order: AssignedOrder) => (
                    <div
                      key={order.orderId}
                      onClick={() => handleOrderClick(order.orderId)}
                      className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition-transform duration-150 active:scale-[0.98]"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          handleOrderClick(order.orderId)
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400">
                            Order
                          </p>
                          <p className="text-base font-bold text-zinc-900">
                            #{order.orderId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                            {order.eventType}
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="flex flex-col gap-2.5 px-4 py-3">
                        {/* Time + date */}
                        <div className="flex items-start gap-2.5">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {order.eventTime}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatDate(order.eventDate)}
                            </p>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="flex items-start gap-2.5">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {order.customerName}
                            </p>
                            <a
                              href={`tel:${order.customerPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-0.5 flex items-center gap-1 text-xs font-medium text-orange-600"
                            >
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </a>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                          <div>
                            <p className="text-xs leading-relaxed text-zinc-600">
                              {order.customerAddress}
                            </p>
                            <button
                              onClick={(e) =>
                                handleLocationClick(order.locationUrl, e)
                              }
                              className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600"
                              type="button"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open in Maps
                            </button>
                          </div>
                        </div>

                        {/* Stats grid */}
                        <div className="mt-0.5 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-2.5">
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              People
                            </p>
                            <p className="text-sm font-bold text-zinc-900">
                              {order.totalPeople}
                            </p>
                          </div>
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              Total
                            </p>
                            <p className="text-sm font-bold text-zinc-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              Advance
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(order.advanceAmount)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-orange-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-orange-500">
                              Balance
                            </p>
                            <p className="text-sm font-bold text-orange-600">
                              {formatCurrency(order.balanceAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Returnable Items ── */}
            <section className="pb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">
                  Items to Return
                </h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {returnableItems.length}
                </span>
              </div>

              {returnableItems.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-10 text-center">
                  <Package className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                  <p className="text-sm text-zinc-400">No pending returns</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {returnableItems.map((item: ReturnableItem) => (
                    <div
                      key={item.deliveryId}
                      onClick={() => handleOrderClick(item.orderId)}
                      className="cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition-transform duration-150 active:scale-[0.98]"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          handleOrderClick(item.orderId)
                      }}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400">
                            Order
                          </p>
                          <p className="text-base font-bold text-zinc-900">
                            #{item.orderId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              item.status === 'Pending Return'
                                ? 'bg-orange-50 text-orange-600'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {item.status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="flex flex-col gap-3 px-4 py-3">
                        {/* Main vessel summary */}
                        <div className="rounded-lg bg-zinc-50 p-3">
                          <p className="mb-1.5 text-[11px] font-medium text-zinc-400">
                            {item.vesselName}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[11px] text-zinc-400">Given</p>
                              <p className="text-sm font-bold text-zinc-900">
                                {item.quantityGiven}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-zinc-400">
                                Returned
                              </p>
                              <p className="text-sm font-bold text-green-600">
                                {item.quantityReturned}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-zinc-400">
                                Pending
                              </p>
                              <p className="text-sm font-bold text-orange-600">
                                {item.pendingReturn}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Pickup date */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-400">Pickup:</span>
                          <span className="text-xs font-semibold text-zinc-800">
                            {formatDate(item.returnPickupDate)}
                          </span>
                        </div>

                        {/* All vessels */}
                        {item.vessels?.length > 0 && (
                          <div className="border-t border-zinc-100 pt-3">
                            <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                              All Items
                            </p>
                            <div className="flex flex-col gap-1.5">
                              {item.vessels.map((vessel: Vessel) => (
                                <div
                                  key={vessel.id}
                                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs"
                                >
                                  <span className="font-medium text-zinc-800">
                                    {vessel.name}
                                  </span>
                                  <div className="flex gap-3 text-zinc-500">
                                    <span>
                                      G:{' '}
                                      <span className="font-semibold text-zinc-700">
                                        {vessel.quantityGiven}
                                      </span>
                                    </span>
                                    <span>
                                      R:{' '}
                                      <span className="font-semibold text-green-600">
                                        {vessel.quantityReturned}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default DriverDashboardPage
