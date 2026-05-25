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
  ChevronDown,
  X,
} from 'lucide-react'
import { useFetchDashboard } from '@/queries/dashboardQueries'

const fmt = (n: number) =>
  `₹${(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

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
      <div className="flex items-center justify-center min-h-screen bg-orange-50 px-4">
        <div className="flex flex-col gap-3 items-center text-center">
          <AlertCircle className="w-12 h-12 text-orange-500" />
          <p className="text-slate-700 font-semibold text-sm">Error loading dashboard</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="flex flex-col gap-3 items-center">
          <div className="w-10 h-10 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const pendingCount = data?.orders?.pending?.length || 0
  const transitCount = data?.orders?.outForDelivery?.length || 0
  const completedCount = data?.orders?.completed?.length || 0
  const allOrders = [
    ...(data?.orders?.pending || []),
    ...(data?.orders?.outForDelivery || []),
    ...(data?.orders?.completed || []),
  ]

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex flex-col gap-3">

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Dashboard</h1>
              {data?.startDate && data?.endDate && (
                <p className="text-xs text-slate-400">
                  {new Date(data.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(data.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPeriod('MONTHLY'); setDateRange(null); setShowDatePicker(false) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !dateRange
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  showDatePicker || dateRange
                    ? 'border-orange-400 text-orange-600 bg-orange-50'
                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Custom
                <ChevronDown className={`w-3 h-3 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Date Picker */}
          {showDatePicker && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => { setShowDatePicker(false); setDateRange(null); setStartDate(''); setEndDate('') }}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="px-4 py-4 pb-8 flex flex-col gap-4">

        {/* ── KPI GRID ── */}
        {stats && (
          <div className="flex flex-col gap-2.5">

            {/* Row 1: Revenue, Expense, Profit */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{fmt(stats.totalRevenue)}</p>
                  <p className="text-xs text-slate-400">Revenue</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{fmt(stats.totalExpense)}</p>
                  <p className="text-xs text-slate-400">Expenses</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{fmt(stats.netProfit)}</p>
                  <p className="text-xs text-slate-400">
                    Profit{' '}
                    <span className="text-slate-500 font-semibold">
                      {stats.totalRevenue > 0
                        ? `${((stats.netProfit / stats.totalRevenue) * 100).toFixed(0)}%`
                        : '0%'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Row 2: Pending Payments hero + Orders & Plates */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-orange-100">Pending Payments</p>
                  <p className="text-2xl font-bold text-white leading-none">{fmt(stats.totalPendingPayments)}</p>
                  <p className="text-xs text-orange-200">Awaiting collection</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="col-span-1 flex flex-col gap-2.5">
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{stats.totalOrders}</p>
                  <p className="text-xs text-slate-400">Orders</p>
                </div>
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{stats.totalPlates}</p>
                  <p className="text-xs text-slate-400">Plates</p>
                </div>
              </div>
            </div>
          </div>
        )}

{/* ── ORDER STATUS PILLS ── */}
{data?.orders && (
  <div className="grid grid-cols-3 gap-2.5">
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col gap-1.5">
      <Clock className="w-4 h-4 text-amber-500" />
      <p className="text-2xl font-bold text-amber-900 leading-none">{pendingCount}</p>
      <p className="text-xs font-medium text-amber-600">Pending</p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex flex-col gap-1.5">
      <Truck className="w-4 h-4 text-blue-500" />
      <p className="text-2xl font-bold text-blue-900 leading-none">{transitCount}</p>
      <p className="text-xs font-medium text-blue-600">Transit</p>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex flex-col gap-1.5">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <p className="text-2xl font-bold text-green-900 leading-none">{completedCount}</p>
      <p className="text-xs font-medium text-green-600">Done</p>
    </div>
  </div>
)}  

        {/* ── ORDERS TABLE ── */}
        {allOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Orders</h2>
              <span className="text-xs text-slate-400 font-medium">{allOrders.length} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Customer</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Date</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((o, i) => (
                    <tr
                      key={o.orderId}
                      className={`hover:bg-slate-50 transition-colors ${i !== allOrders.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-[110px] truncate">
                        {o.customerName}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(o.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900 whitespace-nowrap">
                        ₹{(o.grandTotalAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          o.orderStatus === 'Pending'
                            ? 'bg-amber-100 text-amber-700'
                            : o.orderStatus === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
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

        {/* ── PENDING PAYMENTS TABLE ── */}
        {data?.pendingPayments && data.pendingPayments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Pending Payments</h2>
              <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                {data.pendingPayments.length} due
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Customer</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Total</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Paid</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingPayments.map((p: any, i: number) => (
                    <tr
                      key={p.orderId}
                      className={`hover:bg-slate-50 transition-colors ${i !== data.pendingPayments.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 max-w-[110px] truncate">
                        {p.customerName}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-600 whitespace-nowrap">
                        ₹{(p.grandTotalAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
                        ₹{(p.advanceAmount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-500 whitespace-nowrap">
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