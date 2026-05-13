import { Spinner } from '@/components/common/Buttons'
import React, { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useFetchExpensesReport,
  type ReportPeriod,
} from '@/queries/reportsQueries'
import FinancialReport, { type ReportResponse } from '../test'

export const DownloadReportsPage = () => {
  const [searchParams] = useSearchParams()

  // Extract query parameters
  const period = useMemo(() => {
    const p = searchParams.get('period')
    return p ? (p as ReportPeriod) : undefined
  }, [searchParams])

  const from = useMemo(
    () => searchParams.get('from') ?? undefined,
    [searchParams]
  )
  const to = useMemo(() => searchParams.get('to') ?? undefined, [searchParams])

  // ✅ API CALL (controlled)
  const { data, isLoading, isError, isFetching } = useFetchExpensesReport(
    period,
    from,
    to
  )

  if (isLoading || isFetching)
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    )

  if (isError && !data)
    return <div className="text-center text-red-500">Failed to load report</div>

  if (!period && !from && !to && !isLoading) {
    return (
      <div className="text-center text-gray-500">
        Select a period or date range to view report
      </div>
    )
  }

  if (data) {
    // Construct full ReportResponse object for FinancialReport
    const reportResponse: ReportResponse = {
      success: true,
      message: 'Report generated successfully',
      data: data,
      timestamp: new Date().toISOString(),
    }

    return <FinancialReport reportData={reportResponse} />
  }
}

export default DownloadReportsPage
