import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock3, Package } from 'lucide-react'

const DriverPendingOrdersPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(`/driver/driver-dashboard/${id}`, { replace: true })
  }

  const dummyOrders = [
    { orderId: 1043, customerName: 'Sample Customer 1', pendingAmount: 1200 },
    { orderId: 1051, customerName: 'Sample Customer 2', pendingAmount: 850 },
    { orderId: 1064, customerName: 'Sample Customer 3', pendingAmount: 2450 },
  ]

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
            {dummyOrders.length}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
        {t('driver_pending_orders_dummy_note')}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {dummyOrders.map((order) => (
          <div
            key={order.orderId}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-900">#{order.orderId}</p>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600">
                {t('driver_dummy')}
              </span>
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
              <span className="font-semibold text-orange-600">₹{order.pendingAmount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DriverPendingOrdersPage
