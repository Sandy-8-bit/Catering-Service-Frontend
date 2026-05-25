import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calculator, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import ProductMenuSelector from '@/components/orders/ProductMenuSelector'
import { useCalculateOrderMaterials } from '@/queries/recipeQueries'
import type { OrderItem } from '@/types/order'
import type {
  OrderMaterialProductItem,
  OrderMaterialDetail,
} from '@/types/recipe'

// ─── PDF ─────────────────────────────────────────────────────────────────────

const RECEIPT_W = 80
const M = 5
const CW = RECEIPT_W - M * 2

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
  bold = false
) => {
  doc.setFontSize(size)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setTextColor(30, 30, 30)
  doc.text(text, RECEIPT_W / 2, y, { align: 'center' })
}

const rowText = (
  doc: jsPDF,
  left: string,
  right: string,
  y: number,
  size = 8,
  bold = false
) => {
  doc.setFontSize(size)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setTextColor(30, 30, 30)
  doc.text(left, M, y)
  doc.text(right, M + CW, y, { align: 'right' })
}

const buildPdf = (
  items: OrderMaterialProductItem[],
  sourceItems: OrderItem[]
): jsPDF => {
  const rowH = 6
  const headerH = 50
  const sourceH = sourceItems.length * rowH + 20

  // Calculate table height including items and materials
  let tableH = 0
  items.forEach((item) => {
    tableH += 8 // Product header
    tableH += ((item.rawMaterials?.length ?? 0) + (item.subProducts?.length ?? 0)) * rowH
    tableH += 4 // spacing between items
  })
  tableH += 20

  const footerH = 20
  const totalHeight = headerH + sourceH + tableH + footerH

  const doc = new jsPDF({
    unit: 'mm',
    format: [RECEIPT_W, Math.max(totalHeight, 120)],
  })

  let y = 10

  centeredText(doc, 'RAW MATERIALS REPORT', y, 10, true)
  y += 6
  centeredText(doc, new Date().toLocaleString(), y, 7)
  y += 8
  solidLine(doc, y)
  y += 6

  // Source products
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('BASED ON', M, y)
  y += 5

  sourceItems.forEach((item) => {
    rowText(
      doc,
      item.productPrimaryName || 'Product',
      `×${item.quantity}`,
      y
    )
    y += rowH
  })

  y += 2
  dashedLine(doc, y)
  y += 6

  // Materials by product
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('MATERIALS REQUIRED', M, y)
  y += 5

  items.forEach((item) => {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text(item.productPrimaryName, M, y)
    y += rowH

    // Raw materials
    item.rawMaterials.forEach((material) => {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(material.rawMaterialPrimaryName, M + 2, y)
      doc.text(material.unit, M + CW * 0.55, y)
      doc.setFont('helvetica', 'bold')
      doc.text(material.totalQuantity.toFixed(2), M + CW, y, {
        align: 'right',
      })
      if (material.notes) {
        y += rowH
        doc.setFontSize(6)
        doc.setTextColor(120, 120, 120)
        doc.text(`Note: ${material.notes}`, M + 2, y)
      }
      y += rowH
    })

    // Sub products
    item.subProducts.forEach((subProduct) => {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(`[${subProduct.rawMaterialPrimaryName}]`, M + 2, y)
      doc.text(subProduct.unit, M + CW * 0.55, y)
      doc.setFont('helvetica', 'bold')
      doc.text(subProduct.totalQuantity.toFixed(2), M + CW, y, {
        align: 'right',
      })
      if (subProduct.notes) {
        y += rowH
        doc.setFontSize(6)
        doc.setTextColor(120, 120, 120)
        doc.text(`Note: ${subProduct.notes}`, M + 2, y)
      }
      y += rowH
    })

    y += 2
  })

  y += 2
  solidLine(doc, y)
  y += 6
  centeredText(doc, `${items.length} product${items.length !== 1 ? 's' : ''} calculated`, y, 7)

  return doc
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CalculateRawMaterialsPage = () => {
  const navigate = useNavigate()
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [result, setResult] = useState<OrderMaterialProductItem[] | null>(null)
  const [showResult, setShowResult] = useState(false)

  const { mutateAsync: calculateMaterials, isPending } =
    useCalculateOrderMaterials()

  const handleCalculate = async () => {
    if (!selectedItems.length) {
      toast.error('Add at least one menu item to calculate requirements')
      return
    }

    try {
      const payload = selectedItems.map((item) => ({
        productId: item.product.productId,
        quantity: item.quantity,
      }))
      const data = await calculateMaterials(payload)
      setResult(data ?? [])
      setShowResult(true)
    } catch {
      // handled in query
    }
  }

  const handleDownload = () => {
    if (!result?.length) return
    try {
      const doc = buildPdf(result, selectedItems)
      doc.save(`raw-materials-${Date.now()}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  const getTotalMaterials = () => {
    if (!result) return 0
    return result.reduce(
      (sum, item) => sum + (item.rawMaterials?.length ?? 0) + (item.subProducts?.length ?? 0),
      0
    )
  }

  const getMaterialsWithNotes = () => {
    if (!result) return 0
    return result.reduce((sum, item) => {
      const withNotes =
        (item.rawMaterials?.filter((m) => m.notes).length ?? 0) +
        (item.subProducts?.filter((m) => m.notes).length ?? 0)
      return sum + withNotes
    }, 0)
  }

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row items-center justify-between gap-4 p-4">
        <h1 className="flex w-max flex-row items-center gap-2 text-start text-xl font-semibold text-zinc-800">
          <ArrowLeft
            onClick={() => navigate(-1)}
            size={24}
            className="cursor-pointer hover:scale-105 active:scale-110"
          />
          Calculate Raw Materials
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-5 p-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-800">
            Select Menu Items
          </h2>
          <p className="text-sm text-zinc-500">
            Add products and their quantities to calculate the total raw
            materials required.
          </p>
        </div>

        <ProductMenuSelector
          selectedItems={selectedItems}
          onChange={setSelectedItems}
        />

        <div className="flex justify-end border-t border-zinc-100 pt-4">
          <ButtonSm
            state="default"
            onClick={handleCalculate}
            isPending={isPending}
            disabled={!selectedItems.length}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calculate Requirement
          </ButtonSm>
        </div>
      </section>

      {showResult && result && (
        <DialogBox setToggleDialogueBox={setShowResult} width="600px">
          <div className="flex flex-col gap-5">
            {/* Dialog header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  Raw Materials Required
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {getTotalMaterials()} material{getTotalMaterials() !== 1 ? 's' : ''} •{' '}
                  {result.length} product
                  {result.length !== 1 ? 's' : ''} •{' '}
                  {getMaterialsWithNotes()} with notes
                </p>
              </div>
              <ButtonSm state="outline" onClick={handleDownload}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </ButtonSm>
            </div>

            {/* Based on */}
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
              <p className="mb-2 text-xs font-medium tracking-wider text-zinc-400 uppercase">
                Based on
              </p>
              <div className="flex flex-col gap-1">
                {selectedItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-zinc-600"
                  >
                    <span>{item.productPrimaryName}</span>
                    <span className="font-medium text-zinc-800">
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results by product */}
            <div className="max-h-[400px] space-y-4 overflow-y-auto">
              {result.map((item) => (
                <div
                  key={item.productId}
                  className="rounded-lg border border-zinc-200 p-4"
                >
                  {/* Product header */}
                  <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-2">
                    <h4 className="font-semibold text-zinc-900">
                      {item.productPrimaryName}
                    </h4>
                    <span className="text-xs font-medium text-zinc-500">
                      Qty: {item.orderedQuantity}
                    </span>
                  </div>

                  {/* Raw Materials */}
                  {(item.rawMaterials?.length ?? 0) > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-medium tracking-wider text-orange-600 uppercase">
                        Raw Materials
                      </p>
                      {(item.rawMaterials ?? []).map((material, idx) => (
                        <div key={`raw-${item.productId}-${idx}`} className="space-y-0.5 text-sm">
                          <div className="flex items-center justify-between text-zinc-700">
                            <span>{material.rawMaterialPrimaryName}</span>
                            <span className="font-semibold text-zinc-900">
                              {material.totalQuantity.toFixed(2)} {material.unit}
                            </span>
                          </div>
                          {material.rawMaterialSecondaryName && (
                            <p className="text-xs text-zinc-400">
                              {material.rawMaterialSecondaryName}
                            </p>
                          )}
                          {material.notes && (
                            <p className="text-xs italic text-amber-600">
                              💡 {material.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub Products */}
                  {(item.subProducts?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium tracking-wider text-blue-600 uppercase">
                        Sub Products
                      </p>
                      {(item.subProducts ?? []).map((subProduct, idx) => (
                        <div key={`sub-${item.productId}-${idx}`} className="space-y-0.5 text-sm">
                          <div className="flex items-center justify-between text-zinc-700">
                            <span>[{subProduct.rawMaterialPrimaryName}]</span>
                            <span className="font-semibold text-zinc-900">
                              {subProduct.totalQuantity.toFixed(2)}{' '}
                              {subProduct.unit}
                            </span>
                          </div>
                          {subProduct.notes && (
                            <p className="text-xs italic text-amber-600">
                              💡 {subProduct.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Overall Summary */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-3 text-xs font-medium tracking-wider text-emerald-700 uppercase">
                Overall Summary
              </p>
              <div className="space-y-2 text-sm">
                {(() => {
                  const allMaterials: OrderMaterialDetail[] = []
                  result.forEach((item) => {
                    allMaterials.push(...item.rawMaterials)
                    allMaterials.push(...item.subProducts)
                  })

                  // Group by material and sum quantities
                  const grouped = new Map<
                    number,
                    {
                      name: string
                      unit: string
                      total: number
                      notes: string[]
                    }
                  >()

                  allMaterials.forEach((material) => {
                    const key = material.rawMaterialId
                    if (!grouped.has(key)) {
                      grouped.set(key, {
                        name: material.rawMaterialPrimaryName,
                        unit: material.unit,
                        total: 0,
                        notes: [],
                      })
                    }
                    const entry = grouped.get(key)!
                    entry.total += material.totalQuantity
                    if (material.notes && !entry.notes.includes(material.notes)) {
                      entry.notes.push(material.notes)
                    }
                  })

                  return Array.from(grouped.values()).map((entry, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between font-medium text-zinc-800">
                        <span>{entry.name}</span>
                        <span>
                          {entry.total.toFixed(2)} {entry.unit}
                        </span>
                      </div>
                      {entry.notes.length > 0 && (
                        <p className="text-xs text-amber-700">
                          📌 {entry.notes.join(', ')}
                        </p>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>
          </div>
        </DialogBox>
      )}
    </main>
  )
}

export default CalculateRawMaterialsPage
