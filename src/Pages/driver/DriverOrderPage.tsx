import { useParams } from 'react-router-dom'
import { useFetchDriverOrderDelivery } from '@/queries/driverQueries'
import type { DriverOrderDetail } from '@/types/driverOrderDetail'

const DriverOrderPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  const { data, isLoading, isError } = useFetchDriverOrderDelivery({
    orderId: parsedOrderId,
  })

  const order: DriverOrderDetail | undefined = data?.[0]

  if (isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading...</div>
  }

  if (isError || !order) {
    return (
      <div className="p-6 text-sm text-red-500">
        Failed to load order details
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">
        Order Details (ID: {order.orderId})
      </h1>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-slate-500">Customer</p>
        <p className="font-medium">{order.customerName}</p>
        <p className="text-sm">{order.customerPhone}</p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-slate-500">Event</p>
        <p className="font-medium">{order.eventType}</p>
        <p className="text-sm">
          {order.eventDate} • {order.eventTime}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 rounded-lg border p-4">
        <div>
          <p className="text-sm text-slate-500">Total</p>
          <p>₹{order.orderTotalAmount}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Advance</p>
          <p>₹{order.orderAdvanceAmount}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Balance</p>
          <p
            className={
              order.orderBalanceAmount < 0
                ? 'text-red-500'
                : 'text-green-600'
            }
          >
            ₹{order.orderBalanceAmount}
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-slate-500 mb-1">Status</p>
        <span className="inline-block rounded bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
          {order.status}
        </span>
      </div>
    </div>
  )
}

export default DriverOrderPage
