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

interface BillMeta {
  to?: string
  ms?: string // M/s field
  place?: string
  time?: string
  no?: string
  cellNo?: string
  advance?: string
  day?: string
  date?: string
}

// ─── PDF Layout Constants ─────────────────────────────────────────────────────

const PAGE_W = 148 // A5 width in mm (close to the physical bill aspect ratio)
const PAGE_H = 210 // A5 height in mm
const ML = 8 // left margin
const MR = 8 // right margin
const CW = PAGE_W - ML - MR

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hLine = (
  doc: jsPDF,
  y: number,
  x1 = ML,
  x2 = ML + CW,
  lw = 0.3,
  color: [number, number, number] = [30, 30, 30]
) => {
  doc.setDrawColor(...color)
  doc.setLineWidth(lw)
  doc.setLineDashPattern([], 0)
  doc.line(x1, y, x2, y)
}

const vLine = (doc: jsPDF, x: number, y1: number, y2: number, lw = 0.3) => {
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(lw)
  doc.line(x, y1, x, y2)
}

const rect = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  lw = 0.3
) => {
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(lw)
  doc.rect(x, y, w, h)
}

const txt = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  size: number,
  style: 'normal' | 'bold' = 'normal',
  color: [number, number, number] = [30, 30, 30],
  align: 'left' | 'center' | 'right' = 'left'
) => {
  doc.setFontSize(size)
  doc.setFont('helvetica', style)
  doc.setTextColor(...color)
  doc.text(text, x, y, { align })
}

// ─── Main PDF Builder ─────────────────────────────────────────────────────────

const buildPdf = (data: BillData, type: BillType, meta: BillMeta): jsPDF => {
  const customerItems: BillCustomerItem[] = data.customerItems ?? []
  const rawMaterials: BillRawMaterial[] = data.rawMaterials ?? []

  const doc = new jsPDF({ unit: 'mm', format: [PAGE_W, PAGE_H] })

  // ── Outer border ────────────────────────────────────────────────────────────
  rect(doc, ML - 2, 6, CW + 4, PAGE_H - 12, 0.5)

  let y = 10

  // ── HEADER BLOCK ────────────────────────────────────────────────────────────
  // Top row: logo | business name | contact info
  const headerH = 22
  const logoX = ML
  const logoW = 20
  const contactX = PAGE_W - MR - 38
  const nameX = ML + logoW + 3
  const nameW = contactX - nameX - 2

  // Logo placeholder box (replace with actual image via doc.addImage)
  rect(doc, logoX, y, logoW, headerH, 0.3)
  txt(
    doc,
    'LOGO',
    logoX + logoW / 2,
    y + headerH / 2 + 1.5,
    6,
    'bold',
    [160, 160, 160],
    'center'
  )
  // ^ Replace the above two lines with:
  // doc.addImage(logoBase64, 'PNG', logoX, y, logoW, headerH)

  // Business name (center column)
  txt(
    doc,
    'VENKATESHWARA',
    nameX + nameW / 2,
    y + 7,
    11,
    'bold',
    [10, 10, 100],
    'center'
  )
  txt(
    doc,
    'MESS & CATTERING',
    nameX + nameW / 2,
    y + 13,
    11,
    'bold',
    [10, 10, 100],
    'center'
  )

  // Bill type tag (small box above business name area)
  const tagW = 22
  const tagX = nameX + nameW / 2 - tagW / 2
  rect(doc, tagX, y + 0.5, tagW, 5, 0.3)
  txt(
    doc,
    'CASH BILL',
    tagX + tagW / 2,
    y + 4.2,
    6.5,
    'bold',
    [30, 30, 30],
    'center'
  )

  // Contact info (right column)
  txt(doc, 'Cell: 99946 20966', contactX, y + 5, 7, 'normal', [30, 30, 30])
  txt(doc, '82207 77007', contactX, y + 10, 7, 'normal', [30, 30, 30])
  txt(doc, 'Google Pay Number', contactX, y + 15, 6.5, 'normal', [80, 80, 80])
  txt(doc, '96777 20966', contactX, y + 20, 7, 'normal', [30, 30, 30])

  y += headerH + 1

  // ── Divider line under header ────────────────────────────────────────────────
  hLine(doc, y, ML - 2, ML + CW + 2, 0.4)
  y += 4

  // ── Bill Number + Address row ────────────────────────────────────────────────
  txt(doc, 'No.', ML, y, 8, 'normal', [80, 80, 80])
  txt(doc, String(data.orderId ?? '—'), ML + 6, y, 9, 'bold', [10, 10, 100])
  txt(
    doc,
    'Pattanam Road, Vellalore, Coimbatore - 641 111.',
    ML + 20,
    y,
    7,
    'normal',
    [60, 60, 60]
  )

  y += 5
  hLine(doc, y, ML - 2, ML + CW + 2, 0.3)
  y += 5

  // ── Customer Info Block ─────────────────────────────────────────────────────
  // Left column: To / M/s / Place / Cell No  |  Right column: Day / Date
  const rightColX = PAGE_W - MR - 38
  vLine(doc, rightColX - 2, y - 4, y + 28)

  const labelColor: [number, number, number] = [60, 60, 60]
  const dotLeader = (val?: string) =>
    val ? val : '..............................'

  const infoRows: [string, string][] = [
    ['To', dotLeader(meta.to)],
    ['M/s', dotLeader(meta.ms)],
    [
      `Place  :  ${dotLeader(meta.place)}   Time : ${meta.time ?? '........'}   No: ${meta.no ?? '........'}`,
      '',
    ],
    [
      `Cell No  :  ${dotLeader(meta.cellNo)}   Advance: ${meta.advance ?? '........'}`,
      '',
    ],
  ]

  infoRows.forEach(([left, right], i) => {
    txt(doc, left, ML, y, 7.5, 'normal', labelColor)
    if (right) {
      txt(doc, right, ML + 14, y, 7.5, 'normal', [30, 30, 30])
    }
    if (i === 1) {
      // Day / Date on right for rows 0 & 1
    }
    y += 6
  })

  // Day / Date on the right column
  const infoStartY = y - 4 * 6 // rewind to where we started info rows
  txt(doc, 'Day :', rightColX, infoStartY + 3, 7.5, 'normal', labelColor)
  txt(
    doc,
    meta.day ?? '..............',
    rightColX + 8,
    infoStartY + 3,
    7.5,
    'normal',
    [30, 30, 30]
  )
  txt(doc, 'Date :', rightColX, infoStartY + 14, 7.5, 'normal', labelColor)
  txt(
    doc,
    meta.date ?? '..............',
    rightColX + 10,
    infoStartY + 14,
    7.5,
    'normal',
    [30, 30, 30]
  )

  y += 1
  hLine(doc, y, ML - 2, ML + CW + 2, 0.4)

  // ── Table header ─────────────────────────────────────────────────────────────
  const tableTop = y
  const rowH = 7.5
  const col = {
    sno: ML,
    snoW: 10,
    particulars: ML + 10,
    particularsW: CW - 10 - 22 - 22 - 18,
    qty: ML + 10 + (CW - 10 - 22 - 22 - 18),
    qtyW: 22,
    rate: ML + 10 + (CW - 10 - 22 - 22 - 18) + 22,
    rateW: 22,
    amtRs: ML + 10 + (CW - 10 - 22 - 22 - 18) + 44,
    amtRsW: 12,
    amtP: ML + 10 + (CW - 10 - 22 - 22 - 18) + 44 + 12,
    amtPW: 6,
  }

  // Header row fill (light blue-grey to match the physical bill header)
  doc.setFillColor(220, 225, 245)
  doc.rect(ML - 2, y, CW + 4, rowH, 'F')

  y += rowH - 2
  txt(doc, 'S.No.', col.sno, y, 7, 'bold', [30, 30, 100], 'left')
  txt(
    doc,
    'Particulars',
    col.particulars + col.particularsW / 2,
    y,
    7,
    'bold',
    [30, 30, 100],
    'center'
  )
  txt(
    doc,
    'QTY.',
    col.qty + col.qtyW / 2,
    y,
    7,
    'bold',
    [30, 30, 100],
    'center'
  )
  txt(
    doc,
    'RATE',
    col.rate + col.rateW / 2,
    y,
    7,
    'bold',
    [30, 30, 100],
    'center'
  )
  txt(
    doc,
    'AMOUNT',
    col.amtRs + col.amtRsW / 2,
    y,
    7,
    'bold',
    [30, 30, 100],
    'center'
  )
  y += 2
  txt(
    doc,
    'Rs.',
    col.amtRs + col.amtRsW / 2 - 3,
    y,
    6.5,
    'normal',
    [30, 30, 100],
    'center'
  )
  txt(
    doc,
    'P.',
    col.amtP + col.amtPW / 2,
    y,
    6.5,
    'normal',
    [30, 30, 100],
    'center'
  )
  y += 2

  hLine(doc, y, ML - 2, ML + CW + 2, 0.4)

  // Vertical column dividers in header
  const colDividers = [
    col.particulars,
    col.qty,
    col.rate,
    col.amtRs,
    col.amtP,
    ML + CW + 2,
  ]
  colDividers.forEach((x) => vLine(doc, x, tableTop, y))

  // ── Table rows ────────────────────────────────────────────────────────────────
  const tableDataStart = y
  const itemRowH = 7.5
  const MAX_ITEM_ROWS = 14

  // Combine customer items + raw materials into rows
  type RowEntry = {
    sno: number
    particulars: string
    qty: string
    rate: string
    total: string
  }
  const rows: RowEntry[] = []

  customerItems.forEach((item, i) => {
    rows.push({
      sno: i + 1,
      particulars: item.productName ?? '—',
      qty: item.quantity != null ? String(item.quantity) : '—',
      rate: item.unitPrice != null ? `${item.unitPrice}` : '—',
      total: item.lineTotal != null ? `${item.lineTotal}` : '—',
    })
  })

  if (rawMaterials.length > 0 && (type === 'STAFF' || type === 'OWNER')) {
    rawMaterials.forEach((mat, i) => {
      rows.push({
        sno: customerItems.length + i + 1,
        particulars: mat.rawMaterialName ?? '—',
        qty:
          mat.requiredQuantity != null
            ? `${mat.requiredQuantity} ${mat.unit ?? ''}`
            : '—',
        rate: '—',
        total: '—',
      })
    })
  }

  // Pad with empty rows to fill the table
  const totalDisplayRows = Math.max(rows.length, MAX_ITEM_ROWS)

  for (let i = 0; i < totalDisplayRows; i++) {
    const row = rows[i]
    const ry = y + i * itemRowH

    if (row) {
      txt(
        doc,
        String(row.sno),
        col.sno + col.snoW / 2,
        ry + 5,
        7.5,
        'normal',
        [30, 30, 30],
        'center'
      )
      const nameLines = doc.splitTextToSize(
        row.particulars,
        col.particularsW - 2
      ) as string[]
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 30, 30)
      doc.text(nameLines, col.particulars + 1, ry + 5)
      txt(
        doc,
        row.qty,
        col.qty + col.qtyW / 2,
        ry + 5,
        7.5,
        'normal',
        [30, 30, 30],
        'center'
      )
      txt(
        doc,
        row.rate,
        col.rate + col.rateW / 2,
        ry + 5,
        7.5,
        'normal',
        [30, 30, 30],
        'center'
      )
      txt(
        doc,
        row.total,
        col.amtRs + col.amtRsW - 1,
        ry + 5,
        7.5,
        'bold',
        [30, 30, 30],
        'right'
      )
    }

    // Row bottom line
    hLine(doc, ry + itemRowH, ML - 2, ML + CW + 2, 0.15, [180, 180, 180])
  }

  // Vertical column dividers for table body
  const tableBodyBottom = y + totalDisplayRows * itemRowH
  colDividers.forEach((x) => vLine(doc, x, tableDataStart, tableBodyBottom))
  vLine(doc, ML - 2, tableDataStart, tableBodyBottom)
  hLine(doc, tableBodyBottom, ML - 2, ML + CW + 2, 0.4)

  y = tableBodyBottom

  // ── Footer row: Tamil note + Total ──────────────────────────────────────────
  const footerH = 14
  const footerMidX = PAGE_W * 0.6

  vLine(doc, footerMidX, y, y + footerH)

  // Tamil note on left
  txt(
    doc,
    'குறிப்பு : கலைகாத பாத்திரத்திற்கு',
    ML,
    y + 5,
    7,
    'normal',
    [40, 40, 40]
  )
  txt(doc, '200 ரூபாய் வசூலிக்கப்படும்', ML, y + 10, 7, 'normal', [40, 40, 40])

  // Total on right
  txt(
    doc,
    'Total',
    footerMidX + (PAGE_W - MR - footerMidX) / 2,
    y + 5.5,
    8,
    'bold',
    [30, 30, 100],
    'center'
  )
  if (data.totalAmount != null) {
    txt(
      doc,
      `Rs. ${(data.totalAmount as number).toLocaleString()}`,
      footerMidX + (PAGE_W - MR - footerMidX) / 2,
      y + 11,
      9,
      'bold',
      [10, 10, 10],
      'center'
    )
  }

  hLine(doc, y + footerH, ML - 2, ML + CW + 2, 0.4)
  y += footerH

  // ── Materials row ────────────────────────────────────────────────────────────
  const matH = 14
  vLine(doc, footerMidX, y, y + matH)

  txt(doc, 'Materials :', ML, y + 5, 7.5, 'normal', [40, 40, 40])

  txt(
    doc,
    `For VENKATESHWARA MESS & CATTERING`,
    footerMidX + 2,
    y + 5,
    6.5,
    'bold',
    [30, 30, 100]
  )

  hLine(doc, y + matH, ML - 2, ML + CW + 2, 0.4)

  // Close outer border bottom
  rect(doc, ML - 2, 6, CW + 4, PAGE_H - 12, 0.5)

  return doc
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DownloadBillButtonProps {
  orderId: number
  compact?: boolean
  // Bill meta fields (matching physical bill layout)
  to?: string
  ms?: string
  place?: string
  time?: string
  no?: string
  cellNo?: string
  advance?: string
  day?: string
  date?: string
}

const DownloadBillButton: React.FC<DownloadBillButtonProps> = ({
  orderId,
  compact,
  to,
  ms,
  place,
  time,
  no,
  cellNo,
  advance,
  day,
  date,
}) => {
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

  const meta: BillMeta = { to, ms, place, time, no, cellNo, advance, day, date }

  const handleDownload = async (option: BillOption) => {
    setIsOpen(false)
    setLoadingType(option.type)
    try {
      const data = await fetchOrderBill(orderId, option.type)
      const doc = buildPdf({ ...data, orderId }, option.type, meta)
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
        className={`flex cursor-pointer flex-row items-center border-2 border-[#F1F1F1] bg-white font-semibold text-black shadow-sm outline-0 transition-colors duration-200 select-none hover:bg-gray-100 active:bg-gray-200 ${
          compact
            ? 'gap-1 rounded-lg px-2 py-1 text-xs'
            : 'gap-2 rounded-[9px] px-3 py-3 text-sm'
        } ${isAnyLoading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        {isAnyLoading ? (
          <Loader2
            className={
              compact
                ? 'h-3 w-3 animate-spin text-zinc-500'
                : 'h-4 w-4 animate-spin text-zinc-500'
            }
          />
        ) : (
          <Download
            className={
              compact ? 'h-3 w-3 text-zinc-700' : 'h-4 w-4 text-zinc-700'
            }
          />
        )}
        {t('download_bill')}
        <ChevronDown
          className={`text-zinc-400 transition-transform duration-200 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${
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
