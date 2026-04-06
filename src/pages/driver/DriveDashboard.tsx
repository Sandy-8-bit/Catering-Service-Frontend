import { useParams, useNavigate } from 'react-router-dom'
import { useState, type MouseEvent } from 'react'
import Cookies from 'js-cookie'
import { useTranslation } from 'react-i18next'
import { useFetchDriverDashboard } from '@/queries/driverQueries'
import type {
  AssignedOrder,
  ReturnableItem,
  DriverDashboard,
  Vessel,
} from '@/types/driverDash'
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal'
import { appRoutes } from '@/routes/appRoutes'
import {
  Calendar,
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  ChevronRight,
  ExternalLink,
  LogOut,
} from 'lucide-react'

const DriverDashboardPage = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const driverId = Number(id)

  const [date, setDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [orderFilter] = useState<'all' | 'pending'>('all')

  const { data, isLoading, isError } = useFetchDriverDashboard({
    driverId,
    date,
  })

  const dashboardData = data as DriverDashboard | undefined
  const assignedOrders: AssignedOrder[] = dashboardData?.assignedOrders ?? []
  const returnableItems: ReturnableItem[] = dashboardData?.returnableItems ?? []
  const pendingOrders = assignedOrders.filter((order) => order.balanceAmount > 0)
  const visibleOrders =
    orderFilter === 'pending' ? pendingOrders : assignedOrders

  const handleOrderClick = (orderId: number) => {
    navigate(`/driver/order/${orderId}`)
  }

  const handleLocationClick = (
    url: string,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation()
    window.open(url, '_blank')
  }

  const handleLogoutConfirm = () => {
    Cookies.remove('CATERING_TOKEN')
    localStorage.removeItem('CATERING_TOKEN')
    localStorage.removeItem('CATERING_ROLE')
    navigate(appRoutes.signInPage, { replace: true })
  }

  const handleLanguageChange = (lang: 'en' | 'ta') => {
    i18n.changeLanguage(lang)
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

  const getReturnStatusLabel = (status: string) => {
    if (status === 'Pending Return') return t('driver_status_pending_return')
    if (status === 'Completed Return') return t('driver_status_completed_return')
    return status
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base font-semibold tracking-tight text-zinc-900">
              {t('driver_dashboard')}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-zinc-200 bg-white p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`rounded-md px-2 py-1 ${
                    i18n.language.startsWith('en')
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ta')}
                  className={`rounded-md px-2 py-1 ${
                    i18n.language.startsWith('ta')
                      ? 'bg-orange-500 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t('logout')}
              </button>
            </div>
          </div>

          <div className="relative mt-2.5">
            <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pr-4 pl-9 text-sm font-medium text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate(`/driver/pending-orders/${driverId}`)}
            className="mt-2 inline-flex items-center rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
          >
            {t('driver_pending_orders_page_title')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
              <p className="text-xs text-zinc-500">{t('loading')}</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              {t('driver_failed_to_load_data')}
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              {t('driver_try_again_later')}
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="flex flex-col gap-6">
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">
                    {t('driver_today_deliveries')}
                  </h2>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                    {visibleOrders.length}{' '}
                    {visibleOrders.length === 1 ? t('order') : t('orders')}
                  </span>
                </div>

                {/* <div className="flex rounded-lg border border-zinc-200 bg-white p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOrderFilter('all')}
                    className={`rounded-md px-2.5 py-1 ${
                      orderFilter === 'all'
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {t('all')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderFilter('pending')}
                    className={`rounded-md px-2.5 py-1 ${
                      orderFilter === 'pending'
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {t('driver_pending_with_count', { count: pendingOrders.length })}
                  </button>
                </div> */}
              </div>

              {visibleOrders.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-10 text-center">
                  <Package className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                  <p className="text-sm text-zinc-400">
                    {orderFilter === 'pending'
                      ? t('driver_no_pending_orders')
                      : t('driver_no_deliveries_scheduled')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {visibleOrders.map((order: AssignedOrder) => (
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
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400">
                            {t('order')}
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

                      <div className="flex flex-col gap-2.5 px-4 py-3">
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
                              {t('open_in_maps')}
                            </button>
                          </div>
                        </div>

                        <div className="mt-0.5 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-2.5">
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              {t('total_people')}
                            </p>
                            <p className="text-sm font-bold text-zinc-900">
                              {order.totalPeople}
                            </p>
                          </div>
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              {t('total')}
                            </p>
                            <p className="text-sm font-bold text-zinc-900">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-zinc-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-zinc-400">
                              {t('advance')}
                            </p>
                            <p className="text-sm font-bold text-green-600">
                              {formatCurrency(order.advanceAmount)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-orange-50 p-2.5">
                            <p className="mb-0.5 text-[11px] text-orange-500">
                              {t('balance')}
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

            <section className="pb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-900 uppercase">
                  {t('driver_items_to_return')}
                </h2>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  {returnableItems.length}
                </span>
              </div>

              {returnableItems.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white py-10 text-center">
                  <Package className="mx-auto mb-2 h-10 w-10 text-zinc-300" />
                  <p className="text-sm text-zinc-400">{t('driver_no_pending_returns')}</p>
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
                      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-medium text-zinc-400">
                            {t('order')}
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
                            {getReturnStatusLabel(item.status)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-400" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 px-4 py-3">
                        <div className="rounded-lg bg-zinc-50 p-3">
                          <p className="mb-1.5 text-[11px] font-medium text-zinc-400">
                            {item.vesselName}
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[11px] text-zinc-400">{t('driver_given')}</p>
                              <p className="text-sm font-bold text-zinc-900">
                                {item.quantityGiven}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-zinc-400">
                                {t('driver_returned')}
                              </p>
                              <p className="text-sm font-bold text-green-600">
                                {item.quantityReturned}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-zinc-400">
                                {t('driver_pending')}
                              </p>
                              <p className="text-sm font-bold text-orange-600">
                                {item.pendingReturn}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-400">{t('driver_pickup')}:</span>
                          <span className="text-xs font-semibold text-zinc-800">
                            {formatDate(item.returnPickupDate)}
                          </span>
                        </div>

                        {item.vessels?.length > 0 && (
                          <div className="border-t border-zinc-100 pt-3">
                            <p className="mb-2 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                              {t('all_items')}
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

      <LogoutConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  )
}

export default DriverDashboardPage
