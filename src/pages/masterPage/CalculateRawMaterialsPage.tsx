import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CreditCard,
  Minus,
  Plus,
  Download,
  Loader2,
  FlaskConical,
  Layers,
} from 'lucide-react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'

import { useFetchProducts } from '@/queries/productQueries'
import { useCalculateRawMaterials } from '@/queries/calculateRawMaterialsQueries'
import type {
  CalculateRawMaterialsRequest,
  CalculateRawMaterialsProductItem,
} from '@/types/calculateRawMaterials'
import { formatQuantityForDisplay } from './utils'

// ─── Font Registration ────────────────────────────────────────────────────────

Font.register({
  family: 'NotoSansTamil',
  fonts: [
    { src: '/fonts/NotoSansTamil-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansTamil-Bold.ttf', fontWeight: 'bold' },
  ],
})

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const pdfStyles = StyleSheet.create({
  page: {
    // A5: 148mm × 210mm — react-pdf uses pt (1mm ≈ 2.8346pt)
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 36,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e1e1e',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    color: '#111111',
    textAlign: 'center',
  },
  billSubtitle: {
    fontSize: 8.5,
    color: '#777777',
    marginTop: 3,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 8,
    color: '#999999',
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Dividers ──────────────────────────────────────────────────────────────
  solidDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    marginVertical: 8,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    borderBottomStyle: 'dashed',
    marginVertical: 6,
  },

  // ── Summary Cards Row ─────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fafafa',
  },
  summaryCardLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#a0a0a0',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  summaryCardValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },

  // ── Products Used Section ─────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ffffff',
  },
  // Tamil font applied only to product/material name text nodes
  chipTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 8,
    color: '#3f3f46',
  },
  chipQty: {
    fontSize: 8,
    color: '#ea580c',
    fontFamily: 'Helvetica-Bold',
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    alignItems: 'flex-start',
  },
  colMaterial: {
    flex: 1,
  },
  colQty: {
    width: 52,
    textAlign: 'right',
  },
  colUnit: {
    width: 38,
    textAlign: 'right',
  },
  // Tamil font — only the name text inside each row
  materialPrimaryTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 9,
    color: '#111111',
    fontWeight: 'bold',
  },
  materialSecondaryTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 7.5,
    color: '#71717a',
    marginTop: 1,
  },
  qtyValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
    textAlign: 'right',
  },
  unitValue: {
    fontSize: 8,
    color: '#71717a',
    textAlign: 'right',
    fontFamily: 'Helvetica',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerThankYou: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    marginBottom: 3,
  },
  footerNote: {
    fontSize: 7,
    color: '#aaaaaa',
  },
})

// ─── PDF Document Component ───────────────────────────────────────────────────

interface RawMaterialsPdfDocProps {
  materials: CalculateRawMaterialsProductItem[]
  selectedProducts: {
    primaryName: string
    secondaryName?: string
    qty: number
  }[]
  totalProducts: number
  totalQty: number
}

const RawMaterialsPdfDoc = ({
  materials,
  selectedProducts,
  totalProducts,
  totalQty,
}: RawMaterialsPdfDocProps) => {
  const dateLabel = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // Calculate total materials count
  const totalMaterialsCount = materials.reduce(
    (sum, item) => sum + (item.rawMaterials?.length ?? 0) + (item.subProducts?.length ?? 0),
    0
  )

  return (
    <Document>
      {/*
       * A5 in points: 419.53 × 595.28
       * react-pdf accepts named sizes — 'A5' is built-in
       */}
      <Page size="A5" style={pdfStyles.page}>
        {/* ── Business Header ── */}
        <View style={pdfStyles.headerSection}>
          <Text style={pdfStyles.businessName}>
            VENKATESHWARA MESS &amp; CATERING
          </Text>
          <Text style={pdfStyles.billSubtitle}>Raw Materials Bill</Text>
          <Text style={pdfStyles.dateText}>{dateLabel}</Text>
        </View>

        <View style={pdfStyles.solidDivider} />

        {/* ── Summary Cards ── */}
        {/* <View style={pdfStyles.summaryRow}>
          <View style={pdfStyles.summaryCard}>
            <Text style={pdfStyles.summaryCardLabel}>Products Used</Text>
            <Text style={pdfStyles.summaryCardValue}>{totalProducts}</Text>
          </View>
          <View style={pdfStyles.summaryCard}>
            <Text style={pdfStyles.summaryCardLabel}>Total Qty</Text>
            <Text style={pdfStyles.summaryCardValue}>
              {totalQty.toFixed(2)}
            </Text>
          </View>
          <View style={pdfStyles.summaryCard}>
            <Text style={pdfStyles.summaryCardLabel}>Raw Materials</Text>
            <Text style={pdfStyles.summaryCardValue}>{totalMaterialsCount}</Text>
          </View>
        </View> */}

        {/* ── Products Used Chips ── */}
        {selectedProducts.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>Products Used</Text>
            <View style={pdfStyles.chipWrap}>
              {selectedProducts.map((p, i) => (
                <View key={i} style={pdfStyles.chip}>
                  {/* Tamil font only on the product name */}
                  <Text style={pdfStyles.chipTextTamil}>
                    {p.primaryName}{' '}
                    <Text style={pdfStyles.chipQty}>({p.qty.toFixed(2)})</Text>
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={pdfStyles.dashedDivider} />

        {/* ── Materials by Product ── */}
        <Text style={[pdfStyles.sectionTitle, { marginBottom: 4 }]}>
          Required Raw Materials
        </Text>

        {materials.map((product, productIdx) => (
          <View key={productIdx} style={{ marginBottom: 8 }}>
            {/* Product Header */}
            <View style={{ marginBottom: 4 }}>
              <Text style={[pdfStyles.materialPrimaryTamil, { fontSize: 8 }]}>
                {product.productPrimaryName}
              </Text>
              <Text style={{ fontSize: 6.5, color: '#888888' }}>
                Qty: {product.orderedQuantity}
              </Text>
            </View>

            {/* Raw Materials Table */}
            {(product.rawMaterials?.length ?? 0) > 0 && (
              <View style={{ marginBottom: 4 }}>
                <View style={pdfStyles.tableHeaderRow}>
                  <View style={pdfStyles.colMaterial}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { color: '#ea580c', fontSize: 6.5 },
                      ]}
                    >
                      Raw Material
                    </Text>
                  </View>
                  <View style={pdfStyles.colQty}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { textAlign: 'right', fontSize: 6.5 },
                      ]}
                    >
                      Qty
                    </Text>
                  </View>
                  <View style={pdfStyles.colUnit}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { textAlign: 'right', fontSize: 6.5 },
                      ]}
                    >
                      Unit
                    </Text>
                  </View>
                </View>

                {(product.rawMaterials ?? []).map((material, idx) => (
                  <View key={idx} style={pdfStyles.tableRow}>
                    <View style={pdfStyles.colMaterial}>
                      <Text style={pdfStyles.materialPrimaryTamil}>
                        {material.rawMaterialPrimaryName ?? '—'}
                      </Text>
                      {material.rawMaterialSecondaryName ? (
                        <Text style={pdfStyles.materialSecondaryTamil}>
                          {material.rawMaterialSecondaryName}
                        </Text>
                      ) : null}
                      {material.notes && (
                        <Text style={{ fontSize: 6, color: '#d97706' }}>
                          📌 {material.notes}
                        </Text>
                      )}
                    </View>
                   {(() => {
  const { qty, unit } = formatQuantityForDisplay(
    material.totalQuantity ?? 0,
    material.unit
  )
  return (
    <>
      <View style={pdfStyles.colQty}>
        <Text style={pdfStyles.qtyValue}>{qty}</Text>
      </View>
      <View style={pdfStyles.colUnit}>
        <Text style={pdfStyles.unitValue}>{unit}</Text>
      </View>
    </>
  )
})()}
                  </View>
                ))}
              </View>
            )}

            {/* Sub Products Table */}
            {(product.subProducts?.length ?? 0) > 0 && (
              <View style={{ marginBottom: 4 }}>
                <View style={pdfStyles.tableHeaderRow}>
                  <View style={pdfStyles.colMaterial}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { color: '#2563eb', fontSize: 6.5 },
                      ]}
                    >
                      Sub Product
                    </Text>
                  </View>
                  <View style={pdfStyles.colQty}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { textAlign: 'right', fontSize: 6.5 },
                      ]}
                    >
                      Qty
                    </Text>
                  </View>
                  <View style={pdfStyles.colUnit}>
                    <Text
                      style={[
                        pdfStyles.tableHeaderCell,
                        { textAlign: 'right', fontSize: 6.5 },
                      ]}
                    >
                      Unit
                    </Text>
                  </View>
                </View>

                {(product.subProducts ?? []).map((subProduct, idx) => (
                  <View key={idx} style={pdfStyles.tableRow}>
                    <View style={pdfStyles.colMaterial}>
                      <Text style={pdfStyles.materialPrimaryTamil}>
                        [{subProduct.rawMaterialPrimaryName ?? '—'}]
                      </Text>
                      {subProduct.notes && (
                        <Text style={{ fontSize: 6, color: '#d97706' }}>
                          📌 {subProduct.notes}
                        </Text>
                      )}
                    </View>
                    {(() => {
  const { qty, unit } = formatQuantityForDisplay(
    subProduct.totalQuantity ?? 0,
    subProduct.unit ?? 'KG'
  )
  return (
    <>
      <View style={pdfStyles.colQty}>
        <Text style={pdfStyles.qtyValue}>{qty}</Text>
      </View>
      <View style={pdfStyles.colUnit}>
        <Text style={pdfStyles.unitValue}>{unit}</Text>
      </View>
    </>
  )
})()}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={pdfStyles.solidDivider} />

        {/* ── Footer ── */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerThankYou}>Thank you!</Text>
    
        </View>
      </Page>
    </Document>
  )
}

// ─── UI Sub-Components ────────────────────────────────────────────────────────

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

const detailSectionTitleClass =
  'text-xs font-bold uppercase tracking-[0.2em] text-orange-500'

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CalculateRawMaterialsPage = () => {
  const { t } = useTranslation()

  const [productQuantities, setProductQuantities] = useState<
    Record<number, number>
  >({})
  const [calculationResults, setCalculationResults] = useState<
    CalculateRawMaterialsProductItem[]
  >([])
  const [hasCalculated, setHasCalculated] = useState(false)
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false)

  const { data: allProducts = [], isLoading: isProductsLoading } =
    useFetchProducts()
  const {
    mutate: calculateMaterials,
    isPending: isCalculating,
    isError: isCalculationError,
  } = useCalculateRawMaterials()

  const isRecipeProducts = allProducts.filter((p) => p.isRecipe)

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

  const handleQuantityChange = useCallback(
    (productId: number, quantity: number) => {
      setProductQuantities((prev) => ({
        ...prev,
        [productId]: Math.max(0, quantity),
      }))
    },
    []
  )

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

  const handleResetCalculation = useCallback(() => {
    setHasCalculated(false)
    setCalculationResults([])
  }, [])

  const handleClearAll = useCallback(() => {
    setProductQuantities({})
    setCalculationResults([])
    setHasCalculated(false)
  }, [])

  /**
   * Generate the PDF using @react-pdf/renderer and trigger browser download.
   * pdf() returns a blob asynchronously — no direct DOM manipulation needed.
   */
  const handleDownloadPdf = useCallback(async () => {
    try {
      setIsDownloadingPDF(true)

      // Build the list of selected products to embed in the PDF
      const selectedProducts = allProducts
        .filter((p) => (productQuantities[p.id] || 0) > 0)
        .map((p) => ({
          primaryName: p.primaryName,
          secondaryName: p.secondaryName,
          qty: productQuantities[p.id] || 0,
        }))

      // Render the React PDF document to a Blob
      const blob = await pdf(
        <RawMaterialsPdfDoc
          materials={calculationResults}
          selectedProducts={selectedProducts}
          totalProducts={totalSelectedProducts}
          totalQty={totalSelectedQuantity}
        />
      ).toBlob()

      // Create an object URL and trigger download
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5)
      anchor.href = url
      anchor.download = `raw-materials-${timestamp}.pdf`
      anchor.click()

      // Clean up the object URL after download is triggered
      URL.revokeObjectURL(url)

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
  }, [
    allProducts,
    calculationResults,
    productQuantities,
    t,
    totalSelectedProducts,
    totalSelectedQuantity,
  ])
  

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
              ) : isRecipeProducts.length > 0 ? (
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
                      {isRecipeProducts.map((product) => (
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
          // Results Panel
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
                  value={(() => {
                    const count = calculationResults.reduce(
                      (sum, item) =>
                        sum + (item.rawMaterials?.length ?? 0) + (item.subProducts?.length ?? 0),
                      0
                    )
                    return count
                  })()}
                />
              </div>

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
<div className="flex flex-col gap-4 overflow-y-auto">
  {calculationResults.map((item) => {
    const rawCount = item.rawMaterials?.length ?? 0
    const subCount = item.subProducts?.length ?? 0

    return (
      <div
        key={item.productId}
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4"
      >
        {/* Product header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-zinc-900">
            {item.productPrimaryName}
          </h4>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            Qty: {item.orderedQuantity}
          </span>
        </div>

        {/* Raw Materials */}
        {rawCount > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-orange-600" />
              <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase">
                Raw materials ({rawCount})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {(item.rawMaterials ?? []).map((material, idx) => {
                const { qty, unit } = formatQuantityForDisplay(
                  material.totalQuantity,
                  material.unit
                )
                return (
                  <div
                    key={`raw-${item.productId}-${idx}`}
                    className="flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-700">
                        {material.rawMaterialPrimaryName}
                      </span>
                      <span className="shrink-0 font-semibold text-zinc-900">
                        {qty} {unit}
                      </span>
                    </div>
                    {material.rawMaterialSecondaryName && (
                      <p className="text-xs text-zinc-400">
                        {material.rawMaterialSecondaryName}
                      </p>
                    )}
                    {material.notes && (
                      <p className="text-xs text-amber-600">
                        {material.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sub Products */}
        {subCount > 0 && (
          <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">
                Sub products ({subCount})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {(item.subProducts ?? []).map((subProduct, idx) => {
                const { qty, unit } = formatQuantityForDisplay(
                  subProduct.totalQuantity,
                  subProduct.unit ?? 'KG'
                )
                return (
                  <div
                    key={`sub-${item.productId}-${idx}`}
                    className="flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-zinc-700">
                        {subProduct.rawMaterialPrimaryName}
                      </span>
                      <span className="shrink-0 font-semibold text-zinc-900">
                        {qty} {unit}
                      </span>
                    </div>
                    {subProduct.notes && (
                      <p className="text-xs text-amber-600">
                        {subProduct.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  })}
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
