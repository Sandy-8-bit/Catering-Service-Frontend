import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useFetchDriverDashboard } from '@/queries/driverQueries'
import type { AssignedOrder, ReturnableItem, DriverDashboard, Vessel } from '@/types/driverDash'
import { Calendar, Package, MapPin, Phone, User, Clock, ChevronRight, ExternalLink } from 'lucide-react'

const DriverDashboardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const driverId = Number(id)

  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
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

  const handleCallClick = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${phone}`
  }

  const handleLocationClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(url, '_blank')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Sticky */}
      <div className=" z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Driver Dashboard
          </h1>
          
          {/* Date Selector */}
          <div className="mt-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-600">Loading...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">Failed to load data</p>
            <p className="text-xs text-red-600 mt-1">Please try again later</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex flex-col gap-6">
            {/* ================= Assigned Orders ================= */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Today's Deliveries
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {assignedOrders.length} {assignedOrders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>

              {assignedOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No deliveries scheduled</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedOrders.map((order: AssignedOrder) => (
                    <div
                      key={order.orderId}
                      onClick={() => handleOrderClick(order.orderId)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOrderClick(order.orderId)
                        }
                      }}
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-slate-500">Order</span>
                          <p className="text-base font-semibold text-slate-900">#{order.orderId}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                            {order.eventType}
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col gap-3">
                  
                        {/* Time */}
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {order.eventTime}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(order.eventDate)}
                            </p>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {order.customerName}
                            </p>
                            <button
                              onClick={(e) => handleCallClick(order.customerPhone, e)}
                              className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5 active:text-blue-700 hover:text-blue-700 transition-colors"
                              type="button"
                            >
                              <Phone className="w-3 h-3" />
                              {order.customerPhone}
                            </button>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {order.customerAddress}
                            </p>
                            <button
                              onClick={(e) => handleLocationClick(order.locationUrl, e)}
                              className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1.5 active:text-blue-700 hover:text-blue-700 transition-colors"
                              type="button"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open in Maps
                            </button>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-xs text-slate-500 mb-0.5">People</p>
                            <p className="text-sm font-semibold text-slate-900">{order.totalPeople}</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5">
                            <p className="text-xs text-slate-500 mb-0.5">Total</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2.5">
                            <p className="text-xs text-green-600 mb-0.5">Advance</p>
                            <p className="text-sm font-semibold text-green-700">
                              {formatCurrency(order.advanceAmount)}
                            </p>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-2.5">
                            <p className="text-xs text-amber-600 mb-0.5">Balance</p>
                            <p className="text-sm font-semibold text-amber-700">
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

            {/* ================= Returnable Items ================= */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Items to Return
                </h2>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {returnableItems.length}
                </span>
              </div>

              {returnableItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No pending returns</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {returnableItems.map((item: ReturnableItem) => (
                    <div
                      key={item.deliveryId}
                      onClick={() => handleOrderClick(item.orderId)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOrderClick(item.orderId)
                        }
                      }}
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-slate-500">Order</span>
                          <p className="text-base font-semibold text-slate-900">#{item.orderId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            item.status === 'Pending Return' 
                              ? 'text-amber-700 bg-amber-50' 
                              : 'text-green-700 bg-green-50'
                          }`}>
                            {item.status}
                          </span>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col gap-3">
                        {/* Main Vessel Summary */}
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 mb-2">Main Item</p>
                          <p className="text-sm font-semibold text-slate-900 mb-2">
                            {item.vesselName}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-slate-500">Given</p>
                              <p className="text-sm font-semibold text-slate-900">{item.quantityGiven}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Returned</p>
                              <p className="text-sm font-semibold text-green-600">{item.quantityReturned}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Pending</p>
                              <p className="text-sm font-semibold text-amber-600">{item.pendingReturn}</p>
                            </div>
                          </div>
                        </div>

                        {/* Pickup Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500">Pickup:</span>
                          <span className="text-sm font-medium text-slate-900">
                            {formatDate(item.returnPickupDate)}
                          </span>
                        </div>

                        {/* All Vessels */}
                        {item.vessels?.length > 0 && (
                          <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500 mb-2">All Items</p>
                            <div className="flex flex-col gap-2">
                              {item.vessels.map((vessel: Vessel) => (
                                <div
                                  key={vessel.id}
                                  className="flex items-center justify-between text-xs bg-slate-50 rounded-lg p-2"
                                >
                                  <span className="font-medium text-slate-700">{vessel.name}</span>
                                  <div className="flex gap-3 text-slate-600">
                                    <span>
                                      <span className="text-slate-400">G:</span> {vessel.quantityGiven}
                                    </span>
                                    <span>
                                      <span className="text-slate-400">R:</span> {vessel.quantityReturned}
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