import React, { useState } from 'react'
import { Calendar, Download, ChevronDown, X, Users } from 'lucide-react'
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
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string } | null>(null)

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
    navigate(`${appRoutes.reports.children.download}?from=${startDate}&to=${endDate}`)
  }

  const { data, isLoading, isError, isFetching } = useFetchExpensesReport(
    customDateRange ? undefined : period,
    customDateRange?.from,
    customDateRange?.to
  )

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-start gap-3 md:items-center md:flex-row  flex-col  justify-between">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{t('expense_reports')}</h1>
              {customDateRange && (
                <p className="text-xs text-slate-400">
                  {new Date(customDateRange.from).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(customDateRange.to).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {period === 'MONTHLY' && !customDateRange && (
                <p className="text-xs text-slate-400">This month</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePeriodChange('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !customDateRange && period === 'MONTHLY'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  showDatePicker || customDateRange
                    ? 'border-orange-400 text-orange-600 bg-orange-50'
                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Custom
                <ChevronDown className={`w-3 h-3 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>
              {data && (
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">{t('start_date')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">{t('end_date')}</label>
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
                  onClick={handleDateRangeApply}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors"
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

        {/* Loading */}
        {(isLoading || isFetching) && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
            {t('failed_load_report')}
          </div>
        )}

        {/* No Selection */}
        {!period && !customDateRange && !isLoading && !isError && (
          <div className="flex flex-col gap-3 items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-700">{t('select_period_or_range')}</p>
              <p className="text-xs text-slate-400">Pick "This Month" or set a custom date range</p>
            </div>
          </div>
        )}

        {/* ── DATA ── */}
        {data && (
          <div className="flex flex-col gap-4">

            {/* Summary KPI Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-xs font-bold">₹</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{fmt(data.totalGlobalIncome)}</p>
                  <p className="text-xs text-slate-400">{t('income')}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-500 text-xs font-bold">₹</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{fmt(data.totalGlobalMiscExpense)}</p>
                  <p className="text-xs text-slate-400">{t('expense')}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-orange-100">{t('profit')}</p>
                  <p className="text-2xl font-bold text-white leading-none">{fmt(data.totalGlobalNetProfit)}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">₹</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold text-slate-900 leading-none">{data.totalGlobalPeopleServed ?? 0}</p>
                  <p className="text-xs text-slate-400">{t('people_served')}</p>
                </div>
              </div>
            </div>

            {/* Order Cards */}
            <div className="flex flex-col gap-3">
              {data.orderDetails?.map((order: any) => (
                <div key={order.orderId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.eventDate).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700">{order.totalPeople}</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 flex flex-col gap-3">
               {/* Menu Items */}
{order.menuItems?.length > 0 && (
  <div className="flex flex-col gap-1.5">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('menu')}</p>
    {order.menuItems.map((item: any, i: number) => (
      <div key={i} className="flex items-center justify-between">
        <span className="text-sm text-slate-700 truncate">{item.productName}</span>
        <span className="text-sm font-semibold text-slate-900 ml-3 shrink-0">
          ₹{((item.productLineTotal ?? 0) * (order.totalPeople ?? 1)).toLocaleString('en-IN')}
        </span>
      </div>
    ))}
  </div>
)}

{/* Additional Items — no multiplication */}
{order.additionalMenuItems?.length > 0 && (
  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('additional_items')}</p>
    {order.additionalMenuItems.map((item: any, i: number) => (
      <div key={i} className="flex items-center justify-between">
        <span className="text-sm text-slate-700 truncate">{item.productName}</span>
        <span className="text-sm font-semibold text-slate-900 ml-3 shrink-0">
          ₹{(item.productLineTotal ?? 0).toLocaleString('en-IN')}
        </span>
      </div>
    ))}
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