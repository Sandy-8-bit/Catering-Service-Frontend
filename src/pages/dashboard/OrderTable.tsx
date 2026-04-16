
import { AlertCircle } from 'lucide-react'

const OrderTable = ({
  title,
  orders,
  emptyMessage = 'No orders',
}: {
  title: string
  orders: any[]
  emptyMessage?: string
}) => (
  <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50 overflow-hidden">
    <div className="flex items-center justify-between border-b border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-700" />
        <p className="text-sm font-bold tracking-widest text-amber-700 uppercase">
          {title}
        </p>
      </div>
      <span className="rounded-full bg-amber-800 px-3 py-1 text-xs font-bold text-white">
        {orders.length}
      </span>
    </div>
    <div className="overflow-x-auto">
      {orders.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <AlertCircle className="mr-2 h-5 w-5" />
          {emptyMessage}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-200 bg-amber-50">
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Order ID
              </th>
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Customer
              </th>
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Phone
              </th>
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Event Date
              </th>
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Plates
              </th>
              <th className="px-6 py-3 text-right font-semibold text-amber-700">
                Amount
              </th>
              <th className="px-6 py-3 text-right font-semibold text-amber-700">
                Balance
              </th>
              <th className="px-6 py-3 text-left font-semibold text-amber-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={idx}
                className="border-b border-amber-100 hover:bg-amber-50/50 transition"
              >
                <td className="px-6 py-3 font-semibold text-amber-900">
                  #{order.orderId}
                </td>
                <td className="px-6 py-3 text-gray-700">{order.customerName}</td>
                <td className="px-6 py-3 text-gray-600 text-xs">{order.customerPhone}</td>
                <td className="px-6 py-3 text-gray-600">
                  {new Date(order.eventDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-3 text-center">
                  {order.totalPlates ?? '-'}
                </td>
                <td className="px-6 py-3 text-right font-semibold text-amber-900">
                  ₹{(order.grandTotalAmount || 0).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-3 text-right font-semibold text-red-600">
                  ₹{(order.balanceAmount || 0).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
)

export default OrderTable
