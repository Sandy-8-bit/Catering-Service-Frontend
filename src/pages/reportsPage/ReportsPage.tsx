import React, { useState } from 'react'
import {
  Calendar,
  AlertCircle,
  Download,
  ChevronDown,
  X,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useFetchExpensesReport,
  type ReportPeriod,
} from '@/queries/reportsQueries'
import { Spinner } from '@/components/layout/Spinner'
import { appRoutes } from '@/routes/appRoutes'

const fmt = (n: number) =>
  `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const ReportsPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [period, setPeriod] = useState<ReportPeriod | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customDateRange, setCustomDateRange] = useState<{
    from: string
    to: string
  } | null>(null)

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod)
    setCustomDateRange(null)
    setShowDatePicker(false)
    setStartDate('')
    setEndDate('')
  }

  const handleDateRangeApply = () => {
    if (!startDate || !endDate) return
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }
    setCustomDateRange({ from: startDate, to: endDate })
    setPeriod(undefined)
    setShowDatePicker(false)
  }

  const handleDownloadReport = () => {
    if (period) {
      navigate(`${appRoutes.reports.children.download}?period=${period}`)
      return
    }
    if (!startDate || !endDate) return
    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before end date')
      return
    }
    navigate(
      `${appRoutes.reports.children.download}?from=${startDate}&to=${endDate}`
    )
  }

  const { data, isLoading, isError, isFetching } = useFetchExpensesReport(
    customDateRange ? undefined : period,
    customDateRange?.from,
    customDateRange?.to
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg leading-tight font-bold text-slate-900">
                {t('expense_reports')}
              </h1>
              {customDateRange && (
                <p className="text-xs text-slate-400">
                  {new Date(customDateRange.from).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' – '}
                  {new Date(customDateRange.to).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {period === 'MONTHLY' && !customDateRange && (
                <p className="text-xs text-slate-400">This month</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePeriodChange('MONTHLY')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  !customDateRange && period === 'MONTHLY'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  showDatePicker || customDateRange
                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Custom
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showDatePicker ? 'rotate-180' : ''}`}
                />
              </button>
              {data && (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-2">
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">
                    {t('start_date')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-transparent focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <label className="text-xs font-medium text-slate-500">
                    {t('end_date')}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-transparent focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDateRangeApply}
                  className="flex-1 rounded-lg bg-orange-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  {t('apply')}
                </button>
                <button
                  onClick={() => {
                    setShowDatePicker(false)
                    setCustomDateRange(null)
                    setStartDate('')
                    setEndDate('')
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex flex-col gap-4 px-4 py-4 pb-8">
        {/* Loading */}
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {t('failed_load_report')}
          </div>
        )}

        {/* No Selection */}
        {!period && !customDateRange && !isLoading && !isError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">
                {t('select_period_or_range')}
              </p>
              <p className="text-xs text-slate-400">
                Pick "This Month" or set a custom date range
              </p>
            </div>
          </div>
        )}

        {/* ── DATA ── */}
        {data && (
          <div className="flex flex-col gap-4">
            {/* Summary KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
                  <span className="text-xs font-bold text-green-600">₹</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base leading-none font-bold text-slate-900">
                    {fmt(data.totalGlobalIncome)}
                  </p>
                  <p className="text-xs text-slate-400">{t('income')}</p>
                </div>
              </div>

              {/* Misc Expenses card removed per request */}

              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-3.5">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-orange-100">
                    {t('profit')}
                  </p>
                  <p className="text-2xl leading-none font-bold text-white">
                    {fmt(data.totalGlobalNetProfit)}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <span className="text-sm font-bold text-white">₹</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base leading-none font-bold text-slate-900">
                    {data.totalGlobalPeopleServed ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">{t('people_served')}</p>
                </div>
              </div>
            </div>

            {/* Order Cards */}
            <div className="flex flex-col gap-3">
              {data.orderDetails?.map((order: any) => (
                <div
                  key={order.orderId}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold text-slate-900">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.eventDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700">
                        {order.totalPeople}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 px-4 py-3">
                    {/* Menu Items */}
                    {order.menuItems?.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {t('menu')}
                        </p>
                        {order.menuItems.map((item: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate text-sm text-slate-700">
                              {item.productName}
                            </span>
                            <span className="ml-3 shrink-0 text-sm font-semibold text-slate-900">
                              ₹
                              {(
                                (item.productLineTotal ?? 0) *
                                (order.totalPeople ?? 1)
                              ).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional Items — no multiplication */}
                    {order.additionalMenuItems?.length > 0 && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2">
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          {t('additional_items')}
                        </p>
                        {order.additionalMenuItems.map(
                          (item: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                            >
                              <span className="truncate text-sm text-slate-700">
                                {item.productName}
                              </span>
                              <span className="ml-3 shrink-0 text-sm font-semibold text-slate-900">
                                ₹
                                {(item.productLineTotal ?? 0).toLocaleString(
                                  'en-IN'
                                )}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
