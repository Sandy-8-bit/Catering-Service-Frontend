import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  Download,
  Loader2,
} from 'lucide-react'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'

import { useFetchProducts } from '@/queries/productQueries'
import { useCalculateRawMaterials } from '@/queries/calculateRawMaterialsQueries'
import type {
  CalculateRawMaterialsRequest,
  CalculateRawMaterialsResponse,
} from '@/types/calculateRawMaterials'

/**
 * Summary Card Component - Clean layout for displaying key information
 */
const SummaryCard = ({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) => (
  <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200">
    <p className="mb-1 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
      {label}
    </p>
    <p className="text-base leading-snug font-bold text-zinc-900">{value}</p>
  </div>
)

/**
 * Raw Material Result Card - Bill-like display
 */
const RawMaterialResultCard = ({
  material,
}: {
  material: CalculateRawMaterialsResponse
}) => (
  <article className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200/50 bg-white p-4 transition-all hover:shadow-sm">
    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-semibold text-zinc-900">
        {material.rawMaterialPrimaryName}
      </h4>
      <p className="mt-0.5 truncate text-xs text-zinc-500">
        {material.rawMaterialSecondaryName}
      </p>
    </div>
    <div className="shrink-0 text-right">
      <p className="text-lg font-bold text-orange-600">
        {material.totalQuantity}
      </p>
      <p className="text-xs font-medium text-zinc-500">{material.unit}</p>
    </div>
  </article>
)

const detailSectionTitleClass =
  'text-xs font-bold uppercase tracking-[0.2em] text-orange-500'

/**
 * PDF Builder - Thermal receipt style for raw materials bill
 */
const buildRawMaterialsPdf = (
  materials: CalculateRawMaterialsResponse[]
): jsPDF => {
  const RECEIPT_W = 80 // mm — standard 80mm thermal roll
  const M = 5 // left/right margin
  const CW = RECEIPT_W - M * 2 // usable content width

  const dashedLine = (doc: jsPDF, y: number) => {
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.setLineDashPattern([1, 1], 0)
    doc.line(M, y, M + CW, y)
    doc.setLineDashPattern([], 0)
  }

  const solidLine = (doc: jsPDF, y: number) => {
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.3)
    doc.line(M, y, M + CW, y)
  }

  const centeredText = (
    doc: jsPDF,
    text: string,
    y: number,
    size: number,
    bold = false,
    color: [number, number, number] = [30, 30, 30]
  ) => {
    doc.setFontSize(size)
    doc.setFont('courier', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    doc.text(text, RECEIPT_W / 2, y, { align: 'center' })
  }

  // Estimate page height dynamically
  const rowH = 6
  const estimatedH =
    40 + // header block
    (materials.length > 0 ? 12 + materials.length * rowH : 0) +
    15 // footer
  const pageH = Math.max(estimatedH, 100)

  const doc = new jsPDF({ unit: 'mm', format: [RECEIPT_W, pageH] })

  let y = 8

  // ── Business header ──────────────────────────────────────────────────────
  doc.setFont('courier', 'bold')
  centeredText(doc, 'VENKATESHWARA MESS & CATTERING', y, 11, true)
  y += 6
  doc.setFont('courier', 'normal')
  centeredText(doc, 'Raw Materials Bill', y, 8, false, [100, 100, 100])
  y += 5

  solidLine(doc, y)
  y += 5

  // Date
  const now = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  centeredText(doc, now, y, 8, false, [120, 120, 120])
  y += 6

  dashedLine(doc, y)
  y += 5

  // ── Raw materials ───────────────────────────────────────────────────────
  if (materials.length > 0) {
    doc.setFontSize(7.5)
    doc.setFont('courier', 'bold')
    doc.setTextColor(80, 80, 80)
    doc.text('RAW MATERIALS REQUIRED', M, y)
    y += 4

    // Column headers
    doc.setFontSize(7)
    doc.setFont('courier', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('MATERIAL', M, y)
    doc.text('QTY', M + CW * 0.7, y, { align: 'right' })
    doc.text('UNIT', M + CW, y, { align: 'right' })
    y += 3
    dashedLine(doc, y)
    y += 4

    materials.forEach((material) => {
      const name = material.rawMaterialPrimaryName ?? '—'
      const qty = material.totalQuantity ?? '—'
      const unit = material.unit ?? '—'

      doc.setFontSize(8)
      doc.setFont('courier', 'normal')
      doc.setTextColor(30, 30, 30)
      const nameLines = doc.splitTextToSize(name, CW * 0.65) as string[]
      doc.text(nameLines, M, y)
      doc.setFont('courier', 'bold')
      doc.text(String(qty), M + CW * 0.7, y, { align: 'right' })
      doc.text(unit, M + CW, y, { align: 'right' })
      y += nameLines.length > 1 ? nameLines.length * 4.5 : rowH
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  solidLine(doc, y)
  y += 5
  centeredText(doc, 'Thank you!', y, 8, true, [60, 60, 60])
  y += 5
  centeredText(
    doc,
    'Computer-generated — no signature needed',
    y,
    6.5,
    false,
    [160, 160, 160]
  )

  return doc
}

export const CalculateRawMaterialsPage = () => {
  const { t } = useTranslation()

  // State management - store quantities as a map for easier lookup
  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({})
  const [calculationResults, setCalculationResults] = useState<
    CalculateRawMaterialsResponse[]
  >([])
  const [hasCalculated, setHasCalculated] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)

  // API Calls
  const { data: allProducts = [], isLoading: isProductsLoading } =
    useFetchProducts()
  const {
    mutate: calculateMaterials,
    isPending: isCalculating,
    isError: isCalculationError,
  } = useCalculateRawMaterials()

  // Calculate request payload - only products with quantity > 0
  const calculatePayload = useMemo(
    (): CalculateRawMaterialsRequest[] =>
      Object.entries(productQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([productId, quantity]) => ({
          productId: parseInt(productId),
          quantity,
        })),
    [productQuantities]
  )

  const totalSelectedQuantity = useMemo(
    () =>
      Object.values(productQuantities).reduce(
        (sum, qty) => sum + (qty > 0 ? qty : 0),
        0
      ),
    [productQuantities]
  )

  const totalSelectedProducts = useMemo(
    () => Object.values(productQuantities).filter((qty) => qty > 0).length,
    [productQuantities]
  )

  /**
   * Update quantity for a product
   */
  const handleQuantityChange = useCallback(
    (productId: number, quantity: number) => {
      setProductQuantities((prev) => ({
        ...prev,
        [productId]: Math.max(0, quantity),
      }))
    },
    []
  )

  /**
   * Handle calculation submit
   */
  const handleCalculate = useCallback(() => {
    if (calculatePayload.length === 0) return

    calculateMaterials(calculatePayload, {
      onSuccess: (data) => {
        setCalculationResults(data)
        setHasCalculated(true)
      },
      onError: () => {
        setCalculationResults([])
        setHasCalculated(true)
      },
    })
  }, [calculatePayload, calculateMaterials])

  /**
   * Reset calculation
   */
  const handleResetCalculation = useCallback(() => {
    setHasCalculated(false)
    setCalculationResults([])
  }, [])

  /**
   * Clear all selections
   */
  const handleClearAll = useCallback(() => {
    setProductQuantities({})
    setCalculationResults([])
    setHasCalculated(false)
  }, [])

  /**
   * Handle PDF download
   */
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsDownloadingPDF(true)

      // Generate PDF
      const doc = buildRawMaterialsPdf(calculationResults)

      // Download
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5)
      doc.save(`raw-materials-${timestamp}.pdf`)

      toast.success(
        t('bill_downloaded_success', { billType: t('raw_materials_bill') })
      )
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error(
        t('bill_downloaded_error', { billType: t('raw_materials_bill') })
      )
    } finally {
      setIsDownloadingPDF(false)
    }
  }, [calculationResults, t])

  return (
    <main className="layout-container flex min-h-[95vh] flex-col overflow-hidden rounded-[12px] border border-zinc-200 bg-zinc-50 shadow-sm">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 rounded-full bg-orange-500" />
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            {t('calculate_raw_materials')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasCalculated && (
            <ButtonSm
              state="outline"
              onClick={handleResetCalculation}
              className="font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4 text-black" />
              {t('back_to_calculation')}
            </ButtonSm>
          )}
          {!hasCalculated && (
            <>
              <ButtonSm
                state="outline"
                onClick={handleClearAll}
                disabled={Object.values(productQuantities).every(
                  (q) => q === 0
                )}
                className="font-medium"
              >
                {t('clear_all')}
              </ButtonSm>
              <ButtonSm
                state="default"
                onClick={handleCalculate}
                disabled={totalSelectedProducts === 0 || isCalculating}
                className="font-medium"
              >
                <CreditCard className="mr-2 h-4 w-4 text-white" />
                {isCalculating
                  ? t('calculating')
                  : t('calculate_raw_materials')}
              </ButtonSm>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="flex flex-1 flex-col gap-0 overflow-hidden lg:flex-row">
        {!hasCalculated ? (
          // Product Selection Panel
          <>
            {/* Left Panel - Products Grid/List */}
            <div className="flex w-full flex-col gap-4 border-b border-zinc-200 bg-white p-4 lg:w-2/3 lg:overflow-y-auto lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={detailSectionTitleClass}>{t('products')}</p>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {t('select_products_with_quantity')}
                  </h3>
                </div>
              </div>

              {isProductsLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-zinc-100"
                    />
                  ))}
                </div>
              ) : allProducts.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                          {t('primary_name')}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                          {t('secondary_name')}
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-zinc-700">
                          {t('price')}
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-zinc-700">
                          {t('quantity')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-zinc-200 transition-colors hover:bg-orange-50"
                        >
                          <td className="px-4 py-3 font-medium text-zinc-900">
                            {product.primaryName}
                          </td>
                          <td className="px-4 py-3 text-zinc-600">
                            {product.secondaryName}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-zinc-900">
                            ₹{(product.price || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {/* Minus Button */}
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id,
                                    Math.max(
                                      0,
                                      (productQuantities[product.id] || 0) - 1
                                    )
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white transition-colors hover:bg-zinc-50"
                                type="button"
                              >
                                <Minus className="h-3.5 w-3.5 text-zinc-600" />
                              </button>

                              {/* Quantity Input */}
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={productQuantities[product.id] || ''}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ''
                                      ? 0
                                      : parseFloat(e.target.value)
                                  handleQuantityChange(
                                    product.id,
                                    Math.max(0, isNaN(val) ? 0 : val)
                                  )
                                }}
                                placeholder="0"
                                className="w-14 rounded border border-zinc-300 px-1.5 py-1 text-center text-xs font-semibold text-zinc-900 focus:border-orange-500 focus:outline-none"
                              />

                              {/* Plus Button */}
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id,
                                    (productQuantities[product.id] || 0) + 1
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded border border-orange-200 bg-orange-50 transition-colors hover:bg-orange-100"
                                type="button"
                              >
                                <Plus className="h-3.5 w-3.5 text-orange-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">
                    {t('no_products_available')}
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Summary */}
            <div className="flex w-full flex-col gap-6 overflow-y-auto bg-zinc-50 p-4 lg:w-1/3 lg:bg-white lg:p-6 lg:shadow-[-1px_0_0_0_#e4e4e7]">
              <div className="flex flex-col items-start gap-1">
                <p className={detailSectionTitleClass}>{t('summary')}</p>
                <p className="text-xl font-bold text-zinc-900">
                  {t('selection_summary')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <SummaryCard
                  label={t('selected_products')}
                  value={`${totalSelectedProducts} ${totalSelectedProducts === 1 ? t('product') : t('products')}`}
                />
                <SummaryCard
                  label={t('total_quantity')}
                  value={totalSelectedQuantity.toFixed(2)}
                />
              </div>

              {totalSelectedProducts > 0 && (
                <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-0.5 rounded-full bg-orange-500" />
                    <h3 className="text-base font-bold text-zinc-900">
                      {t('selected_items')}
                    </h3>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {allProducts
                      .filter((p) => (productQuantities[p.id] || 0) > 0)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200/50 bg-zinc-50 p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {product.primaryName}
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                              {product.secondaryName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-lg font-bold text-orange-600">
                              {(productQuantities[product.id] || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="hidden pt-2 lg:block">
                <p className="text-center text-xs text-zinc-500">
                  {t('selection_summary_hint')}
                </p>
              </div>
            </div>
          </>
        ) : (
          // Results Panel - Bill Layout
          <div className="w-full flex-1 overflow-y-auto bg-white p-4 lg:p-6">
            <div className="max-w-4xl">
              <div className="mb-8 flex flex-col items-start gap-1">
                <p className={detailSectionTitleClass}>
                  {t('calculation_results')}
                </p>
                <p className="text-2xl font-bold text-zinc-900">
                  {t('raw_materials_bill')}
                </p>
              </div>

              {/* Results Summary Header */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SummaryCard
                  label={t('products_used')}
                  value={`${totalSelectedProducts} ${totalSelectedProducts === 1 ? t('product') : t('products')}`}
                />
                <SummaryCard
                  label={t('total_quantity_used')}
                  value={totalSelectedQuantity.toFixed(2)}
                />
                <SummaryCard
                  label={t('raw_materials_required')}
                  value={calculationResults.length}
                />
              </div>

              {/* Selected Products Info */}
              {totalSelectedProducts > 0 && (
                <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-zinc-900">
                    {t('products_used')}:
                  </h4>
                  <div className="space-y-2">
                    {allProducts
                      .filter((p) => (productQuantities[p.id] || 0) > 0)
                      .map((product) => (
                        <span
                          key={product.id}
                          className="mr-2 mb-2 inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200"
                        >
                          {product.primaryName} (
                          {(productQuantities[product.id] || 0).toFixed(2)})
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Raw Materials List */}
              <div className="flex flex-col gap-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-4 w-0.5 rounded-full bg-orange-500" />
                  <h3 className="text-base font-bold text-zinc-900">
                    {t('required_raw_materials')}
                  </h3>
                </div>

                {isCalculationError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {t('error_calculating_materials')}
                  </div>
                )}

                {calculationResults.length > 0 ? (
                  <div className="space-y-3">
                    {calculationResults.map((material) => (
                      <RawMaterialResultCard
                        key={material.rawMaterialId}
                        material={material}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center">
                    <p className="text-sm text-zinc-500">
                      {t('no_raw_materials_calculated')}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-8 flex gap-3 print:hidden">
                <ButtonSm
                  state="outline"
                  onClick={handleResetCalculation}
                  className="font-medium"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 text-black" />
                  {t('back_to_calculation')}
                </ButtonSm>
                <ButtonSm
                  state="outline"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPDF}
                  className="font-medium"
                >
                  {isDownloadingPDF ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                  ) : (
                    <Download className="mr-2 h-4 w-4 text-black" />
                  )}
                  {isDownloadingPDF ? t('generating_pdf') : t('download_bill')}
                </ButtonSm>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default CalculateRawMaterialsPage
