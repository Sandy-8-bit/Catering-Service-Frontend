import React, { useMemo, useState } from 'react'
import {
  Calendar,
  AlertCircle,
  TrendingUp,
  Package,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-700 font-medium">Error loading dashboard</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pendingOrdersCount = data?.orders?.pending?.length || 0
  const outForDeliveryCount = data?.orders?.outForDelivery?.length || 0
  const completedCount = data?.orders?.completed?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="px-4 sm:px-6 py-4 mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Dashboard
              </h1>
              {data?.startDate && data?.endDate && (
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(data.startDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  —{' '}
                  {new Date(data.endDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
              {/* DATE FILTER */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setPeriod('MONTHLY')
                setDateRange(null)
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium text-sm hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              This Month
            </button>

            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar size={16} /> Custom Range
            </button>
          </div>
          </div>

        

          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-4 sm:px-6 py-6 mx-auto space-y-6 pb-8">
        {/* KPI CARDS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Revenue
                </p>
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ₹{(stats.totalRevenue ).toFixed(1)}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Total income</p>
            </div>

            {/* Total Expense */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Expenses
                </p>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ₹{(stats.totalExpense ).toFixed(1)}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Total cost</p>
            </div>

            {/* Net Profit */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Profit
                </p>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ₹{(stats.netProfit ).toFixed(1)}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Margin:{' '}
                <span className="font-semibold text-slate-900">
                  {stats.totalRevenue > 0
                    ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </p>
            </div>

            {/* Pending Payments */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Pending
                </p>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ₹{(stats.totalPendingPayments ).toFixed(1)}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Awaiting payment</p>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Orders
                </p>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                {stats.totalOrders}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Total placed</p>
            </div>

            {/* Total Plates */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs sm:text-sm text-slate-600 font-medium uppercase tracking-wide">
                  Plates
                </p>
                <div className="bg-pink-100 p-2 rounded-lg">
                  <Package className="w-4 h-4 text-pink-600" />
                </div>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                {stats.totalPlates}
              </h2>
              <p className="text-xs text-slate-500 mt-2">Total served</p>
            </div>
          </div>
        )}

        {/* ORDER STATUS OVERVIEW */}
        {data?.orders && (
          <div className="grid grid-cols-3 mt-3 mb-3 gap-3 sm:gap-4">
            {/* Pending */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">Pending</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-900">
                {pendingOrdersCount}
              </h3>
            </div>

            {/* Out for Delivery */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">In Transit</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-blue-900">
                {outForDeliveryCount}
              </h3>
            </div>

            {/* Completed */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Completed</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-green-900">
                {completedCount}
              </h3>
            </div>
          </div>
        )}

        {/* ORDERS TABLE */}
        {data?.orders && (
          <div className="bg-white mb-3 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    ...data.orders.pending,
                    ...data.orders.completed,
                    ...data.orders.outForDelivery,
                  ].map((o) => (
                    <tr
                      key={o.orderId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 text-slate-900 font-medium">
                        {o.customerName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-slate-600 text-xs sm:text-sm">
                        {new Date(o.eventDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right font-semibold text-slate-900">
                        ₹{(o.grandTotalAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            o.orderStatus === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : o.orderStatus === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENDING PAYMENTS TABLE */}
        {data?.pendingPayments && data.pendingPayments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Pending Payments</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.pendingPayments.map((p: any) => (
                    <tr
                      key={p.orderId}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 text-slate-900 font-medium">
                        {p.customerName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right font-semibold text-slate-900">
                        ₹{(p.grandTotalAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-green-600 font-medium">
                        ₹{(p.advanceAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right text-red-600 font-semibold">
                        ₹{(p.balanceAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard