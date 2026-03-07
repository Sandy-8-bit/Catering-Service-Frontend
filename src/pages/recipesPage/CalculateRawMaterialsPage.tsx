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
import type { OrderMaterialCalculationRow } from '@/types/recipe'

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
  rows: OrderMaterialCalculationRow[],
  sourceItems: OrderItem[]
): jsPDF => {
  const rowH = 6
  const headerH = 50
  const sourceH = sourceItems.length * rowH + 20
  const tableH = rows.length * rowH + 20
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
    rowText(doc, item.productPrimaryName || 'Product', `×${item.quantity}`, y)
    y += rowH
  })

  y += 2
  dashedLine(doc, y)
  y += 6

  // Table header
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text('MATERIAL', M, y)
  doc.text('UNIT', M + CW * 0.55, y)
  doc.text('QTY', M + CW, y, { align: 'right' })
  y += 4
  dashedLine(doc, y)
  y += 5

  rows.forEach((row) => {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(row.rawMaterialPrimaryName, M, y)
    doc.text(row.unit, M + CW * 0.55, y)
    doc.setFont('helvetica', 'bold')
    doc.text(row.totalQuantity.toFixed(2), M + CW, y, { align: 'right' })
    y += rowH
  })

  y += 2
  solidLine(doc, y)
  y += 6
  centeredText(doc, `${rows.length} materials required`, y, 7)

  return doc
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CalculateRawMaterialsPage = () => {
  const navigate = useNavigate()
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [result, setResult] = useState<OrderMaterialCalculationRow[] | null>(
    null
  )
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
        <DialogBox setToggleDialogueBox={setShowResult} width="500px">
          <div className="flex flex-col gap-5">
            {/* Dialog header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  Raw Materials Required
                </h3>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {result.length} material{result.length !== 1 ? 's' : ''} •{' '}
                  {selectedItems.length} product
                  {selectedItems.length !== 1 ? 's' : ''}
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

            {/* Results table */}
            <div className="max-h-[340px] overflow-y-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-zinc-200 text-xs tracking-wider text-zinc-400 uppercase">
                    <th className="py-2 pr-4 font-medium">Material</th>
                    <th className="py-2 pr-4 font-medium">Unit</th>
                    <th className="py-2 text-right font-medium">Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((row) => (
                    <tr
                      key={row.rawMaterialId}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-zinc-800">
                          {row.rawMaterialPrimaryName}
                        </p>
                        {row.rawMaterialSecondaryName && (
                          <p className="text-xs text-zinc-400">
                            {row.rawMaterialSecondaryName}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-500">{row.unit}</td>
                      <td className="py-2.5 text-right font-semibold text-zinc-900">
                        {row.totalQuantity.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogBox>
      )}
    </main>
  )
}

export default CalculateRawMaterialsPage
