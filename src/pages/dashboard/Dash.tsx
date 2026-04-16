import React, { useMemo, useState } from 'react'
import {
  Calendar,
  TrendingUp,
  Package,
  AlertCircle,
  Check,
  Clock,
} from 'lucide-react'
import { useFetchDashboard, type PeriodType } from '@/queries/dashboardQueries'
import { Spinner } from '@/components/layout/Spinner'
import KPICard from './KPICard'
import OrderTable from './OrderTable'
import PaymentTable from './PaymentTable'

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('MONTHLY')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null)

  const { data: dashboardData, isLoading, error } = useFetchDashboard(
    period,
    dateRange || undefined
  )

  const stats = useMemo(() => {
    if (!dashboardData?.kpi) return null
    return dashboardData.kpi
  }, [dashboardData])

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod)
    setShowDatePicker(false)
    setDateRange(null)
    setStartDate('')
    setEndDate('')
  }

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date')
        return
      }
      setDateRange({
        startDate,
        endDate,
      })
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-lg bg-red-50 p-6 text-red-700">
          <AlertCircle className="mr-2 inline-block h-5 w-5" />
          Error loading dashboard data
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          {dashboardData?.startDate && dashboardData?.endDate && (
            <>
              {new Date(dashboardData.startDate).toLocaleDateString('en-IN')} -{' '}
              {new Date(dashboardData.endDate).toLocaleDateString('en-IN')}
            </>
          )}
        </p>
      </div>

      {/* Period Selector */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">Select Period</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {([ 'MONTHLY'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  !dateRange && period === p
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-white text-amber-600 ring-2 ring-amber-300 hover:bg-amber-50'
                }`}
              >
                This Month
              </button>
            ))}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                showDatePicker
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white text-amber-600 ring-2 ring-amber-300 hover:bg-amber-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Custom Date Range
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="bg-amber-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleDateRangeApply}
                disabled={!startDate || !endDate}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Apply
              </button>
            </div>
            {dateRange && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                Dashboard will show data from{' '}
                <strong>{new Date(dateRange.startDate).toLocaleDateString('en-IN')}</strong> to{' '}
                <strong>{new Date(dateRange.endDate).toLocaleDateString('en-IN')}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {stats && (
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <KPICard
                label="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}`}
                icon={<TrendingUp className="h-6 w-6" />}
              />
              <KPICard
                label="Total Expense"
                value={`₹${stats.totalExpense.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}`}
                icon={<Package className="h-6 w-6" />}
              />
              <KPICard
                label="Net Profit"
                value={`₹${stats.netProfit.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}`}
                icon={<TrendingUp className="h-6 w-6" />}
                subtext={`Margin: ${((stats.netProfit / stats.totalRevenue) * 100).toFixed(1)}%`}
              />
              <KPICard
                label="Pending Payments"
                value={`₹${stats.totalPendingPayments.toLocaleString('en-IN', {
                  maximumFractionDigits: 2,
                })}`}
                icon={<AlertCircle className="h-6 w-6" />}
              />
              <KPICard
                label="Total Orders"
                value={stats.totalOrders}
                icon={<Package className="h-6 w-6" />}
              />
              <KPICard
                label="Total Plates"
                value={stats.totalPlates.toLocaleString('en-IN')}
                icon={<Package className="h-6 w-6" />}
              />
            </div>
          )}

          {/* Order Status Overview */}
          {dashboardData?.orders && (
            <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase">
                      Orders Pending
                    </p>
                    <p className="text-3xl font-bold text-amber-900">
                      {dashboardData.orders.pending.length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase">
                      Out for Delivery
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {dashboardData.orders.outForDelivery.length}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-green-600 uppercase">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-green-900">
                      {dashboardData.orders.completed.length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {/* Orders Tables */}
          {dashboardData?.orders && (
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <OrderTable
                title="Pending Orders"
                orders={dashboardData.orders.pending}
                emptyMessage="No pending orders"
              />
              <OrderTable
                title="Completed Orders"
                orders={dashboardData.orders.completed}
                emptyMessage="No completed orders"
              />
            </div>
          )}

          {/* Pending Payments Table */}
          {dashboardData?.pendingPayments && (
            <div className="mb-8">
              <PaymentTable payments={dashboardData.pendingPayments} />
            </div>
          )}

          {/* Out for Delivery Table */}
          {dashboardData?.orders?.outForDelivery && (
            <OrderTable
              title="Out for Delivery"
              orders={dashboardData.orders.outForDelivery}
              emptyMessage="No orders out for delivery"
            />
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard
