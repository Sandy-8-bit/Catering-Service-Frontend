import React, { useState } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useFetchExpensesReport,
  type ReportPeriod,
} from '@/queries/reportsQueries'
import { Spinner } from '@/components/layout/Spinner'
import { appRoutes } from '@/routes/appRoutes'

const ReportsPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-amber-50 px-4 py-6 sm:px-6 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-amber-900">
          {t('expense_reports')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">{t('view_financial_reports')}</p>
      </div>

      {/* Controls */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-base sm:text-lg font-semibold text-amber-900">
          {t('select_report')}
        </h2>

        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
          {/* Monthly */}
          <button
            onClick={() => handlePeriodChange('MONTHLY')}
            className={`rounded-lg px-6 py-2 font-semibold transition-all text-sm sm:text-base ${
              !customDateRange && period === 'MONTHLY'
                ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700'
                : 'border-2 border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
            }`}
          >
            {t('monthly_report')}
          </button>

          {/* Custom */}
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 font-semibold transition-all text-sm sm:text-base ${
              showDatePicker
                ? 'bg-amber-600 text-white shadow-md hover:bg-amber-700'
                : 'border-2 border-amber-300 bg-white text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            {t('custom_date_range')}
          </button>
          
          {data && (
            <div className="w-full sm:w-auto">
              <button
                onClick={handleDownloadReport}
                className="w-full sm:w-auto rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white shadow-md transition-all hover:bg-amber-700 text-sm sm:text-base"
              >
                {t('download_report')}
              </button>
            </div>
          )}
        </div>

        {/* Date Picker Section */}
        {showDatePicker && (
          <div className="mb-6 rounded-lg border-2 border-amber-200 bg-amber-50 p-4 sm:p-6">
            <h3 className="mb-4 font-semibold text-amber-900 text-sm sm:text-base">
              {t('select_date_range')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-amber-900">
                  {t('start_date')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded border-2 border-amber-300 p-2 focus:border-amber-600 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-amber-900">
                  {t('end_date')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded border-2 border-amber-300 p-2 focus:border-amber-600 focus:outline-none text-sm"
                />
              </div>

              <div className="flex flex-col sm:col-span-2 lg:col-span-1 lg:flex-row items-end gap-3">
                <button
                  onClick={handleDateRangeApply}
                  className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white shadow-sm transition-all hover:bg-amber-600 text-sm"
                >
                  {t('apply')}
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 rounded-lg border-2 border-amber-300 bg-white px-4 py-2 font-semibold text-amber-600 transition-all hover:bg-amber-50 text-sm"
                >
                  {t('cancel')}
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
        <div className="text-center text-red-500 text-sm sm:text-base">{t('failed_load_report')}</div>
      )}

      {/* No Selection State */}
      {!period && !customDateRange && !isLoading && (
        <div className="text-center text-gray-500 text-sm sm:text-base">
          {t('select_period_or_range')}
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          {/* Summary */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title={t('income')} value={data.totalGlobalIncome} />
            <Card title={t('expense')} value={data.totalGlobalMiscExpense} />
            <Card title={t('profit')} value={data.totalGlobalNetProfit} />
            <Card title={t('people_served')} value={data.totalGlobalPeopleServed} />
          </div>

          {/* Orders */}
          <div className="space-y-6">
            {data.orderDetails?.map((order: any) => (
              <div
                key={order.orderId}
                className="rounded-lg border bg-white p-4 sm:p-6"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{order.customerName}</h3>

                <p className="mb-2 mt-2 text-xs sm:text-sm text-gray-500">
                  {order.eventDate} • {order.totalPeople} {t('people')}
                </p>

                {/* Menu */}
                <div className="mb-3">
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-2">{t('menu')}</h4>
                  {order.menuItems?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs sm:text-sm text-slate-700 mb-1">
                      <span className="truncate">{item.productName}</span>
                      <span className="ml-2 shrink-0">₹{item.productLineTotal}</span>
                    </div>
                  ))}
                </div>

                {/* Additional */}
                {order.additionalMenuItems?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-2">{t('additional_items')}</h4>
                    {order.additionalMenuItems?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs sm:text-sm text-slate-700 mb-1">
                        <span className="truncate">{item.productName}</span>
                        <span className="ml-2 shrink-0">₹{item.productLineTotal}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info */}
      <div className="mt-10 rounded border bg-blue-50 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5 sm:mt-0" />
        <span className="text-sm text-blue-800">{t('data_fetch_secure')}</span>
      </div>
    </div>
  )
}

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-lg border bg-white p-4 text-center">
    <p className="text-xs sm:text-sm text-gray-500">{title}</p>
    <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">₹{value ?? 0}</p>
  </div>
)

export default ReportsPage
