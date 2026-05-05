import React, { useState } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { useFetchExpensesReport, type ReportPeriod } from '@/queries/reportsQueries'
import { Spinner } from '@/components/layout/Spinner'

const ReportsPage: React.FC = () => {
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
        <h1 className="text-3xl font-bold text-amber-900 mb-2">
          Expense Reports
        </h1>
        <p className="text-gray-600">
          View financial reports (live data)
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-white p-6">
        <h2 className="text-lg font-semibold text-amber-900 mb-4">
          Select Report
        </h2>

        <div className="flex flex-wrap gap-3 mb-4">
          {/* Monthly */}
          <button
            onClick={() => handlePeriodChange('MONTHLY')}
            className={`px-4 py-2 rounded-lg font-semibold ${
              !customDateRange && period === 'MONTHLY'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-600 ring-2 ring-amber-300'
            }`}
          >
            Monthly
          </button>

          {/* Custom */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 bg-white text-amber-600 ring-2 ring-amber-300"
          >
            <Calendar className="h-4 w-4" />
            Custom Date
          </button>
        </div>

        {/* Date Picker */}
        {showDatePicker && (
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4">
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

              <button
                onClick={handleDateRangeApply}
                className="bg-amber-600 text-white rounded px-4"
              >
                Apply
              </button>
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
        <div className="text-red-500 text-center">
          Failed to load report
        </div>
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
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card title="Income" value={data.totalGlobalIncome} />
            <Card title="Expense" value={data.totalGlobalMiscExpense} />
            <Card title="Profit" value={data.totalGlobalNetProfit} />
            <Card title="People" value={data.totalGlobalPeopleServed} />
          </div>

          {/* Orders */}
          <div className="space-y-6">
            {data.orderDetails?.map((order: any) => (
              <div key={order.orderId} className="border rounded-lg p-4 bg-white">
                <h3 className="font-bold text-lg">
                  {order.customerName}
                </h3>

                <p className="text-sm text-gray-500 mb-2">
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
      <div className="mt-10 border p-4 rounded bg-blue-50">
        <AlertCircle className="inline mr-2" />
        Data is fetched securely using token from cookies
      </div>
    </div>
  )
}

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white p-4 rounded-lg border text-center">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-xl font-bold">₹{value ?? 0}</p>
  </div>
)

export default ReportsPage