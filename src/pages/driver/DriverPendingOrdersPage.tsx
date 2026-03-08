import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock3, Package } from 'lucide-react'
import { useFetchDriverPendingOrders } from '@/queries/driverQueries'

const DriverPendingOrdersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const driverId = id ? Number(id) : undefined

  const { data: pendingOrders = [], isLoading } = useFetchDriverPendingOrders({
    driverId,
  })

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(`/driver/driver-dashboard/${id}`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-4">
      <div className="sticky top-0 z-10 mb-4 rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('back')}
          </button>

          <h1 className="text-sm font-semibold text-zinc-900">
            {t('driver_pending_orders_page_title')}
          </h1>

          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
            {pendingOrders.length}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-zinc-500">
            {t('loading')}
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-zinc-500">
            {t('no_data')}
          </div>
        ) : (
          pendingOrders.map((order) => (
            <div
              key={order.orderId}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-900">
                  #{order.orderId}
                </p>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                <Package className="h-4 w-4" />
                {order.customerName}
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Clock3 className="h-4 w-4" />
                  <span>{t('driver_pending_amount')}</span>
                </div>
                <span className="font-semibold text-orange-600">
                  ₹{order.pendingAmount}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DriverPendingOrdersPage
