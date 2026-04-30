import React, { useState } from 'react'
import { Calendar, Download, AlertCircle } from 'lucide-react'
import { downloadReportPDF, type ReportPeriod } from '@/queries/reportsQueries'
import { Spinner } from '@/components/layout/Spinner'

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('MONTHLY')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customDateRange, setCustomDateRange] = useState<{
    from: string
    to: string
  } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod)
    setShowDatePicker(false)
    setCustomDateRange(null)
    setStartDate('')
    setEndDate('')
  }

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date')
        return
      }
      setCustomDateRange({
        from: startDate,
        to: endDate,
      })
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true)
      const blob = await downloadReportPDF(
        customDateRange ? undefined : period,
        customDateRange?.from,
        customDateRange?.to
      )

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `expense-report-${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download report')
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Expense Reports</h1>
        <p className="text-gray-600">Generate and download expense reports for different periods</p>
      </div>

      {/* Period & Date Selector */}
      <div className="mb-8 rounded-xl border-2 border-amber-300 bg-white p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-amber-900 mb-4">Select Report Period</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {(['MONTHLY'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                  !customDateRange && period === p
                    ? 'bg-amber-600 text-white shadow-lg'
                    : 'bg-white text-amber-600 ring-2 ring-amber-300 hover:bg-amber-50'
                }`}
              >
                {p}
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
            {customDateRange && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                Report will show data from{' '}
                <strong>{new Date(customDateRange.from).toLocaleDateString('en-IN')}</strong> to{' '}
                <strong>{new Date(customDateRange.to).toLocaleDateString('en-IN')}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isDownloading ? (
            <>
              <Spinner />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download PDF Report
            </>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How to Download Report</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>1. Select a report period (Weekly, Monthly, or Yearly)</li>
              <li>2. Or click "Custom Date Range" to select specific dates</li>
              <li>3. Click "Download PDF Report" to generate and download the report</li>
              <li>4. The report will be downloaded as a PDF file to your device</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
