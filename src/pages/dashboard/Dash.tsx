import React, { useMemo, useState } from 'react'
import {
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useFetchDashboard } from '@/queries/dashboardQueries'

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<'MONTHLY'>('MONTHLY')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null)

  const { data, isLoading, error } = useFetchDashboard(period, dateRange || undefined)

  const stats = useMemo(() => data?.kpi, [data])

  const handleApply = () => {
    if (!startDate || !endDate) return
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }
    setDateRange({ startDate, endDate })
    setShowDatePicker(false)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        <AlertCircle className="mr-2" /> Error loading dashboard
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
        {data?.startDate && data?.endDate && (
          <p className="text-gray-600">
            {new Date(data.startDate).toLocaleDateString('en-IN')} -{' '}
            {new Date(data.endDate).toLocaleDateString('en-IN')}
          </p>
        )}
      </div>

      {/* PERIOD */}
      <div className="bg-white p-4 rounded border mb-6">
        <button
          onClick={() => {
            setPeriod('MONTHLY')
            setDateRange(null)
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded mr-2"
        >
          This Month
        </button>

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="px-4 py-2 border rounded flex items-center gap-2"
        >
          <Calendar size={16} /> Custom Range
        </button>

        {showDatePicker && (
          <div className="mt-4 flex gap-3 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded"
            />
            <button onClick={handleApply} className="bg-green-600 text-white px-4 rounded">
              Apply
            </button>
          </div>
        )}
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded border">
            <p>Total Revenue</p>
            <h2>₹{stats.totalRevenue.toLocaleString('en-IN')}</h2>
          </div>

          <div className="bg-white p-4 rounded border">
            <p>Total Expense</p>
            <h2>₹{stats.totalExpense.toLocaleString('en-IN')}</h2>
          </div>

          <div className="bg-white p-4 rounded border">
            <p>Net Profit</p>
            <h2>₹{stats.netProfit.toLocaleString('en-IN')}</h2>
            <p className="text-sm text-gray-500">
              Margin:{' '}
              {stats.totalRevenue > 0
                ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white p-4 rounded border">
            <p>Pending Payments</p>
            <h2>₹{stats.totalPendingPayments.toLocaleString('en-IN')}</h2>
          </div>

          <div className="bg-white p-4 rounded border">
            <p>Total Orders</p>
            <h2>{stats.totalOrders}</h2>
          </div>

          <div className="bg-white p-4 rounded border">
            <p>Total Plates</p>
            <h2>{stats.totalPlates}</h2>
          </div>
        </div>
      )}

      {/* ORDER STATUS */}
      {data?.orders && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-100 p-4 rounded">
            <p>Pending</p>
            <h2>{data.orders.pending.length}</h2>
          </div>

          <div className="bg-blue-100 p-4 rounded">
            <p>Out for Delivery</p>
            <h2>{data.orders.outForDelivery.length}</h2>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <p>Completed</p>
            <h2>{data.orders.completed.length}</h2>
          </div>
        </div>
      )}

      {/* ORDERS TABLE */}
      {data?.orders && (
        <div className="bg-white p-4 rounded border mb-6 overflow-auto">
          <h2 className="mb-3 font-bold">Orders</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Plates</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...data.orders.pending, ...data.orders.completed, ...data.orders.outForDelivery].map(
                (o) => (
                  <tr key={o.orderId} className="border-b text-center">
                    <td>{o.orderId}</td>
                    <td>{o.customerName}</td>
                    <td>{o.eventDate}</td>
                    <td>{o.totalPlates ?? '-'}</td>
                    <td>₹{o.grandTotalAmount ?? 0}</td>
                    <td>{o.orderStatus}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYMENTS */}
      {data?.pendingPayments && (
        <div className="bg-white p-4 rounded border overflow-auto">
          <h2 className="mb-3 font-bold">Pending Payments</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th>Order</th>
                <th>Name</th>
                <th>Total</th>
                <th>Advance</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.pendingPayments.map((p:any) => (
                <tr key={p.orderId} className="border-b text-center">
                  <td>{p.orderId}</td>
                  <td>{p.customerName}</td>
                  <td>₹{p.grandTotalAmount ?? 0}</td>
                  <td>₹{p.advanceAmount}</td>
                  <td>₹{p.balanceAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Dashboard