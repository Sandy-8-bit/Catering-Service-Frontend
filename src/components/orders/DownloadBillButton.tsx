import React, { useState } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import useClickOutside from '@/hooks/useClickOutside'
import {
  fetchOrderBill,
  type BillData,
  type BillType,
  type BillCustomerItem,
  type BillRawMaterial,
} from '@/queries/ordersQueries'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillOption {
  type: BillType
  label: string
  description: string
}

// ─── PDF builder (thermal receipt style) ────────────────────────────────────

const RECEIPT_W = 80 // mm — standard 80mm thermal roll
const M = 5 // left/right margin
const CW = RECEIPT_W - M * 2 // usable content width

// Helpers ────────────────────────────────────────────────────────────────────

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
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setTextColor(...color)
  doc.text(text, RECEIPT_W / 2, y, { align: 'center' })
}

const rowText = (
  doc: jsPDF,
  left: string,
  right: string,
  y: number,
  size = 8,
  bold = false,
  rightColor: [number, number, number] = [30, 30, 30]
) => {
  doc.setFontSize(size)
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setTextColor(30, 30, 30)
  doc.text(left, M, y)
  doc.setTextColor(...rightColor)
  doc.text(right, M + CW, y, { align: 'right' })
}

// ─── Main builder ────────────────────────────────────────────────────────────

const buildPdf = (data: BillData, type: BillType): jsPDF => {
  const customerItems: BillCustomerItem[] = data.customerItems ?? []
  const rawMaterials: BillRawMaterial[] = data.rawMaterials ?? []

  // Estimate page height dynamically so content isn't cropped
  const rowH = 6
  const estimatedH =
    52 + // header block
    (customerItems.length > 0 ? 14 + customerItems.length * rowH : 0) +
    (rawMaterials.length > 0 ? 14 + rawMaterials.length * rowH : 0) +
    (data.totalAmount != null ? 14 : 0) +
    20 // footer
  const pageH = Math.max(estimatedH, 100)

  const doc = new jsPDF({ unit: 'mm', format: [RECEIPT_W, pageH] })

  let y = 8

  // ── Business header ──────────────────────────────────────────────────────
  centeredText(doc, 'CATERING SERVICE', y, 11, true)
  y += 6
  centeredText(
    doc,
    type === 'CUSTOMER'
      ? 'Customer Bill'
      : type === 'STAFF'
        ? 'Kitchen / Staff Bill'
        : 'Owner Bill',
    y,
    8,
    false,
    [100, 100, 100]
  )
  y += 5

  solidLine(doc, y)
  y += 5

  // Order ID + date
  const now = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  rowText(doc, `Order #${data.orderId ?? '—'}`, now, y, 8)
  y += 6

  dashedLine(doc, y)
  y += 5

  // ── Customer items ───────────────────────────────────────────────────────
  if (customerItems.length > 0) {
    // Column headers
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('ITEM', M, y)
    doc.text('QTY', M + CW * 0.55, y, { align: 'center' })
    doc.text('PRICE', M + CW * 0.76, y, { align: 'right' })
    doc.text('TOTAL', M + CW, y, { align: 'right' })
    y += 3
    dashedLine(doc, y)
    y += 4

    customerItems.forEach((item) => {
      const name = item.productName ?? '—'
      const qty = String(item.quantity ?? '—')
      const price = item.unitPrice != null ? `Rs.${item.unitPrice}` : '—'
      const total = item.lineTotal != null ? `Rs.${item.lineTotal}` : '—'

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      // Wrap long names
      const nameLines = doc.splitTextToSize(name, CW * 0.5) as string[]
      doc.text(nameLines, M, y)
      doc.text(qty, M + CW * 0.55, y, { align: 'center' })
      doc.text(price, M + CW * 0.76, y, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(total, M + CW, y, { align: 'right' })
      y += nameLines.length > 1 ? nameLines.length * 4.5 : rowH
    })
  }

  // ── Raw materials (staff / owner) ────────────────────────────────────────
  if (rawMaterials.length > 0) {
    if (customerItems.length > 0) {
      dashedLine(doc, y)
      y += 4
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80, 80, 80)
      doc.text('RAW MATERIALS', M, y)
      y += 4
    }

    // Column headers
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('MATERIAL', M, y)
    doc.text('QTY', M + CW * 0.7, y, { align: 'right' })
    doc.text('UNIT', M + CW, y, { align: 'right' })
    y += 3
    dashedLine(doc, y)
    y += 4

    rawMaterials.forEach((mat) => {
      const name = mat.rawMaterialName ?? '—'
      const qty =
        mat.requiredQuantity != null ? String(mat.requiredQuantity) : '—'
      const unit = mat.unit ?? '—'

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      const nameLines = doc.splitTextToSize(name, CW * 0.6) as string[]
      doc.text(nameLines, M, y)
      doc.text(qty, M + CW * 0.7, y, { align: 'right' })
      doc.setFont('helvetica', 'bold')
      doc.text(unit, M + CW, y, { align: 'right' })
      y += nameLines.length > 1 ? nameLines.length * 4.5 : rowH
    })
  }

  // ── Total (customer / owner) ─────────────────────────────────────────────
  if (data.totalAmount != null) {
    solidLine(doc, y)
    y += 5
    rowText(
      doc,
      'TOTAL',
      `Rs.${(data.totalAmount as number).toLocaleString()}`,
      y,
      10,
      true,
      [30, 30, 30]
    )
    y += 7
  } else {
    dashedLine(doc, y)
    y += 5
  }

  // ── Footer ───────────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────

interface DownloadBillButtonProps {
  orderId: number
}

const DownloadBillButton: React.FC<DownloadBillButtonProps> = ({ orderId }) => {
  const { t } = useTranslation()
  const [dropdownRef, isOpen, setIsOpen] = useClickOutside(false)
  const [loadingType, setLoadingType] = useState<BillType | null>(null)

  const billOptions: BillOption[] = [
    {
      type: 'CUSTOMER',
      label: t('bill_customer'),
      description: t('bill_customer_desc'),
    },
    {
      type: 'STAFF',
      label: t('bill_staff'),
      description: t('bill_staff_desc'),
    },
    {
      type: 'OWNER',
      label: t('bill_owner'),
      description: t('bill_owner_desc'),
    },
  ]

  const handleDownload = async (option: BillOption) => {
    setIsOpen(false)
    setLoadingType(option.type)
    try {
      const data = await fetchOrderBill(orderId, option.type)
      const doc = buildPdf({ ...data, orderId }, option.type)
      const filename = `order-${orderId}-${option.type.toLowerCase()}-bill.pdf`
      doc.save(filename)
      toast.success(t('bill_downloaded_success', { billType: option.label }))
    } catch {
      toast.error(t('bill_downloaded_error', { billType: option.label }))
    } finally {
      setLoadingType(null)
    }
  }

  const isAnyLoading = loadingType !== null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={isAnyLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex cursor-pointer flex-row items-center gap-2 rounded-[9px] border-2 border-[#F1F1F1] bg-white px-3 py-3 text-sm font-semibold text-black shadow-sm outline-0 transition-colors duration-200 select-none hover:bg-gray-100 active:bg-gray-200 ${
          isAnyLoading ? 'cursor-not-allowed opacity-70' : ''
        }`}
      >
        {isAnyLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        ) : (
          <Download className="h-4 w-4 text-zinc-700" />
        )}
        {t('download_bill')}
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-zinc-100">
          <p className="border-b border-zinc-100 px-4 py-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
            {t('select_bill_type')}
          </p>
          <ul className="py-1">
            {billOptions.map((option) => (
              <li key={option.type}>
                <button
                  type="button"
                  disabled={loadingType === option.type}
                  onClick={() => handleDownload(option)}
                  className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    {loadingType === option.type ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-orange-500" />
                    )}
                    {option.label}
                  </span>
                  <span className="pl-5 text-xs text-zinc-400">
                    {option.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DownloadBillButton
