import React, { useState } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  useFetchExpensesReport,
  type ReportPeriod,
} from '@/queries/reportsQueries'
import { Spinner } from '@/components/layout/Spinner'
import { appRoutes } from '@/routes/appRoutes'

const ReportsPage: React.FC = () => {
  const navigate = useNavigate()
  // ❌ start with undefined → prevents auto API call
  const [period, setPeriod] = useState<ReportPeriod | undefined>(undefined)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [customDateRange, setCustomDateRange] = useState<{
    from: string
    to: string
  } | null>(null)

  // ✅ Apply Monthly → triggers API
  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod)
    setCustomDateRange(null)
    setShowDatePicker(false)
    setStartDate('')
    setEndDate('')
  }

  // ✅ Apply date → triggers API
  const handleDateRangeApply = () => {
    if (!startDate || !endDate) return

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }

    setCustomDateRange({
      from: startDate,
      to: endDate,
    })

    setPeriod(undefined) // disable period mode
  }

  const handleDownloadReport = () => {
    // Handle period-based download
    if (period) {
      navigate(`${appRoutes.reports.children.download}?period=${period}`)
      return
    }

    // Handle custom date range download
    if (!startDate || !endDate) return

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }

    navigate(
      `${appRoutes.reports.children.download}?from=${startDate}&to=${endDate}`
    )
  }

  // ✅ API CALL (controlled)
  const { data, isLoading, isError, isFetching } = useFetchExpensesReport(
    customDateRange ? undefined : period,
    customDateRange?.from,
    customDateRange?.to
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-amber-900">
          Expense Reports
        </h1>
        <p className="text-gray-600">View financial reports (live data)</p>
      </div>

      {/* Controls */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-amber-900">
          Select Report
        </h2>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Monthly */}
          <button
            onClick={() => handlePeriodChange('MONTHLY')}
            className={`rounded-lg px-6 py-2 font-semibold transition-all ${
              !customDateRange && period === 'MONTHLY'
                ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700'
                : 'border-2 border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
            }`}
          >
            Monthly
          </button>

          {/* Custom */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 font-semibold transition-all ${
              showDatePicker
                ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700'
                : 'border-2 border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Custom Date
          </button>
          {data && (
            <div className="flex items-end">
              <button
                onClick={handleDownloadReport}
                className="w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white shadow-md transition-all hover:bg-amber-700"
              >
                Download Report
              </button>
            </div>
          )}
        </div>

        {/* Date Picker Section */}
        {showDatePicker && (
          <div className="mb-6 rounded-lg border-2 border-amber-200 bg-amber-50 p-6">
            <h3 className="mb-4 font-semibold text-amber-900">
              Select Date Range
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-900">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded border-2 border-amber-300 p-2 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-amber-900">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded border-2 border-amber-300 p-2 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  onClick={handleDateRangeApply}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white shadow-sm transition-all hover:bg-amber-600"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 rounded-lg border-2 border-amber-300 bg-white px-4 py-2 font-semibold text-amber-600 transition-all hover:bg-amber-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {(isLoading || isFetching) && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center text-red-500">Failed to load report</div>
      )}

      {/* No Selection State */}
      {!period && !customDateRange && !isLoading && (
        <div className="text-center text-gray-500">
          Select a period or date range to view report
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          {/* Summary */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card title="Income" value={data.totalGlobalIncome} />
            <Card title="Expense" value={data.totalGlobalMiscExpense} />
            <Card title="Profit" value={data.totalGlobalNetProfit} />
            <Card title="People" value={data.totalGlobalPeopleServed} />
          </div>

          {/* Orders */}
          <div className="space-y-6">
            {data.orderDetails?.map((order: any) => (
              <div
                key={order.orderId}
                className="rounded-lg border bg-white p-4"
              >
                <h3 className="text-lg font-bold">{order.customerName}</h3>

                <p className="mb-2 text-sm text-gray-500">
                  {order.eventDate} • {order.totalPeople} people
                </p>

                {/* Menu */}
                <div className="mb-3">
                  <h4 className="font-semibold">Menu</h4>
                  {order.menuItems?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.productName}</span>
                      <span>₹{item.productLineTotal}</span>
                    </div>
                  ))}
                </div>

                {/* Additional */}
                <div>
                  <h4 className="font-semibold">Additional</h4>
                  {order.additionalMenuItems?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.productName}</span>
                      <span>₹{item.productLineTotal}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info */}
      <div className="mt-10 rounded border bg-blue-50 p-4">
        <AlertCircle className="mr-2 inline" />
        Data is fetched securely using token from cookies
      </div>
    </div>
  )
}

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-lg border bg-white p-4 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-md font-bold">₹{value ?? 0}</p>
  </div>
)

export default ReportsPage
