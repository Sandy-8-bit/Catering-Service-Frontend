import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from '@react-pdf/renderer'
import {
  fetchOrderBill,
  type BillData,
  type BillType,
  type BillCustomerItem,
  type BillRawMaterial,
} from '@/queries/ordersQueries'

// ─── Font Registration ────────────────────────────────────────────────────────
// Place NotoSansTamil-Regular.ttf in /public/fonts/
// @react-pdf/renderer embeds the TTF into the PDF — Tamil glyphs render correctly.

Font.register({
  family: 'NotoSansTamil',
  fonts: [
    { src: '/fonts/NotoSansTamil-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansTamil-Bold.ttf', fontWeight: 'bold' },
  ],
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillOption {
  type: BillType
  label: string
  description: string
}

interface BillMeta {
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

interface BillCustomerInfo {
  customerId?: number
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  totalPlates?: number
  eventDate?: string
  eventTime?: string
}

interface BillSummary {
  totalAmount?: number | null
  customerItemsTotal?: number | null
  totalRawMaterialCost?: number | null
  totalSubProductCost?: number | null
  profit?: number | null
}

type BillDataWithId = BillData & {
  orderId?: number
  advanceAmount?: number | null // ADD
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (v?: number | null): string => {
  if (v == null) return '--'
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const resolveBillTitle = (type: BillType): string => {
  if (type === 'STAFF') return 'STAFF BILL'
  if (type === 'OWNER') return 'OWNER BILL'
  return 'CUSTOMER BILL'
}

const dot = (v?: string | null): string =>
  v || '................................'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  navy: '#1B2A5C',
  blue: '#1E3A8A',
  blueLight: '#3B6FD4',
  headerBg: '#E8EDF8',
  rowAlt: '#F8F9FD',
  border: '#C8CEDF',
  borderDark: '#1B2A5C',
  text: '#1A1A1A',
  muted: '#4A5568',
  light: '#718096',
  white: '#FFFFFF',
  divider: '#D1D9EF',
  green: '#166534',
  greenBg: '#DCFCE7',
} as const

// ─── Styles ───────────────────────────────────────────────────────────────────
// All measurements in pt. A5 = 419.53 × 595.28 pt
// Latin text: Helvetica (built-in, no TTF needed)
// Tamil text: NotoSansTamil (TTF embedded)

const LATIN = 'Helvetica'
const LATIN_B = 'Helvetica-Bold'
const TAMIL = 'NotoSansTamil'

const s = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    fontFamily: LATIN,
    fontSize: 8,
    color: C.text,
    backgroundColor: C.white,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  // Outer card with full border
  card: {
    flex: 1,
    flexDirection: 'column',
    border: `1pt solid ${C.borderDark}`,
  },

  // ── Header Band ───────────────────────────────────────────────────────────
  headerBand: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    minHeight: 38,
    alignItems: 'stretch',
  },
  logoSection: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: `0.5pt solid rgba(255,255,255,0.2)`,
    paddingVertical: 4,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    border: `1.5pt solid rgba(255,255,255,0.5)`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    fontFamily: LATIN_B,
    fontSize: 11,
    color: C.white,
  },
  businessSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 0,
  },
  businessTagline: {
    fontFamily: LATIN,
    fontSize: 6,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    display: 'none',
  },
  businessName: {
    fontFamily: LATIN_B,
    fontSize: 13,
    color: C.white,
    letterSpacing: 0.5,
  },
  businessSub: {
    fontFamily: LATIN_B,
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
    fontWeight: 'bold',
  },
  contactSection: {
    width: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    gap: 4,
    borderLeft: `0.5pt solid rgba(255,255,255,0.2)`,
    display: 'none',
  },
  contactLine: {
    fontFamily: LATIN,
    fontSize: 7,
    color: 'rgba(255,255,255,0.9)',
  },
  contactMuted: {
    fontFamily: LATIN,
    fontSize: 6,
    color: 'rgba(255,255,255,0.5)',
  },

  // ── Bill Type + Address Strip ─────────────────────────────────────────────
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.headerBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottom: `0.5pt solid ${C.border}`,
    gap: 0,
  },
  billTypePill: {
    backgroundColor: C.navy,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
  },
  billTypePillText: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.white,
    letterSpacing: 0.8,
  },
  billNoLabel: {
    fontFamily: LATIN,
    fontSize: 7,
    color: C.light,
    marginRight: 3,
  },
  billNoValue: {
    fontFamily: LATIN_B,
    fontSize: 9,
    color: C.navy,
    marginRight: 10,
  },
  addressText: {
    fontFamily: LATIN,
    fontSize: 6.5,
    color: C.muted,
    flex: 1,
  },

  // ── Customer Section ──────────────────────────────────────────────────────
  customerSection: {
    flexDirection: 'row',
     fontFamily: LATIN_B,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  customerLeft: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
     fontFamily: LATIN_B,
    borderRight: `0.5pt solid ${C.border}`,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 0,
  },
  infoLabel: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.light,
    width: 40,
    paddingTop: 0.5,
  },
  infoLabel2: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.light,
    width: 30,
    paddingTop: 0.5,
  },
  infoColon: {
    fontFamily: LATIN,
    fontSize: 7,
    color: C.light,
    marginRight: 4,
  },
  infoValue: {
    fontFamily: LATIN,
    fontSize: 7.5,
    color: C.text,
    flex: 1,
    borderBottom: `0.4pt dotted ${C.border}`,
    paddingBottom: 1,
  },
  infoValueTamil: {
    fontFamily: TAMIL,
    fontSize: 7.5,
    color: C.text,
    flex: 1,
    borderBottom: `0.4pt dotted ${C.border}`,
    paddingBottom: 1,
  },
  // Raw materials section
  rmSection: {
    flexDirection: 'column',
    borderTop: `0.8pt solid ${C.borderDark}`,
  },
  rmSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.navy,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rmSectionTitle: {
    fontFamily: LATIN_B,
    fontSize: 7,
    color: C.white,
    letterSpacing: 0.6,
  },
  rmTableHead: {
    flexDirection: 'row',
    backgroundColor: C.headerBg,
    borderBottom: `0.5pt solid ${C.borderDark}`,
    minHeight: 18,
    alignItems: 'center',
  },
  rmRow: {
    flexDirection: 'row',
    minHeight: 14,
    alignItems: 'center',
    borderBottom: `0.25pt solid ${C.divider}`,
  },
  rmRowAlt: {
    flexDirection: 'row',
    minHeight: 14,
    alignItems: 'center',
    borderBottom: `0.25pt solid ${C.divider}`,
    backgroundColor: C.rowAlt,
  },
  infoRowInline: {
    maxWidth: '100%',
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  infoGroup: {
    flexDirection: 'row',
    display: 'flex',
    alignItems: 'flex-start',
    flex: 1,
  },
  customerRight: {
    width: 90,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  dateGroup: {
    gap: 2,
  },
  dateLabel: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.light,
  },
  dateValue: {
    fontFamily: LATIN_B,
    fontSize: 7.5,
    color: C.navy,
    borderBottom: `0.4pt dotted ${C.border}`,
    paddingBottom: 1,
    fontWeight: 'bold',
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableWrapper: {
    flex: 1,
    flexDirection: 'column',
  },

  // Table header
  tableHead: {
    flexDirection: 'row',
    fontFamily: LATIN_B,
    backgroundColor: C.headerBg,
    borderBottom: `0.8pt solid ${C.borderDark}`,
    borderTop: `0.5pt solid ${C.border}`,
    minHeight: 22,
    alignItems: 'center',
  },

  // Column widths
  colSno: { width: 20 },
  colParticulars: { flex: 1 },
  colQty: { width: 44 },
  colRate: { width: 44 },
  colRs: { width: 44 },

  // TH cells
  th: {
    fontFamily: LATIN_B,
    fontSize: 7,
    color: C.navy,
    textAlign: 'center',
    paddingVertical: 3,
  },
  thLeft: {
    fontFamily: LATIN_B,
    fontSize: 7,
    color: C.navy,
    paddingLeft: 6,
    paddingVertical: 3,
  },

  // TD cells
  tableRow: {
    flexDirection: 'row',
    minHeight: 15,
    alignItems: 'center',
    borderBottom: `0.25pt solid ${C.divider}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    minHeight: 15,
    alignItems: 'center',
    borderBottom: `0.25pt solid ${C.divider}`,
    backgroundColor: C.rowAlt,
  },
  tdSno: {
    width: 20,
    textAlign: 'center',
    fontFamily: LATIN,
    fontSize: 7,
    color: C.light,
    paddingVertical: 2,
  },

  // ← KEY FIX: explicit fontFamily: TAMIL on product name column
  tdParticulars: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: TAMIL, // explicit Tamil font — do not change to LATIN
    fontWeight: 'bold', // NotoSansTamil Bold weight
    fontSize: 7.5,
    color: C.text,
    borderLeft: `0.25pt solid ${C.divider}`,
  },
  tdQty: {
    width: 44,
    textAlign: 'center',
    fontFamily: LATIN,
    fontSize: 7,
    color: C.muted,
    borderLeft: `0.25pt solid ${C.divider}`,
    paddingVertical: 2,
  },
  tdRate: {
    width: 44,
    textAlign: 'center',
    fontFamily: LATIN,
    fontSize: 7,
    color: C.muted,
    borderLeft: `0.25pt solid ${C.divider}`,
    paddingVertical: 2,
  },
  tdRs: {
    width: 44,
    textAlign: 'right',
    paddingRight: 6,
    fontFamily: LATIN_B,
    fontSize: 7,
    color: C.text,
    borderLeft: `0.25pt solid ${C.divider}`,
    paddingVertical: 2,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerBar: {
    flexDirection: 'row',
    borderTop: `1pt solid ${C.borderDark}`,
  },
  footerNoteCol: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: 'center',
    gap: 3,
    borderRight: `0.5pt solid ${C.border}`,
  },

  // ← KEY FIX: explicit fontFamily: TAMIL on footer Tamil notes
  footerNote: {
    fontFamily: TAMIL, // explicit Tamil font — do not change to LATIN
    fontWeight: 'normal',
    fontSize: 7,
    color: C.muted,
  },
  footerTotalCol: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  footerTotalChip: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 2,
    marginBottom: 2,
  },
  footerTotalChipText: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.navy,
    letterSpacing: 0.5,
  },
  footerTotalValue: {
    fontFamily: LATIN_B,
    fontSize: 12,
    color: C.navy,
  },

  // ── Summary / Signoff ─────────────────────────────────────────────────────
  signoffBar: {
    flexDirection: 'row',
    borderTop: `0.5pt solid ${C.border}`,
    minHeight: 26,
  },
  signoffLeft: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    gap: 3,
    borderRight: `0.5pt solid ${C.border}`,
  },
  signoffStat: {
    fontFamily: LATIN,
    fontSize: 7,
    color: C.muted,
  },
  signoffStatBold: {
    fontFamily: LATIN_B,
    fontSize: 7.5,
    color: C.blueLight,
  },
  signoffRight: {
    width: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    display: 'none',
  },
  signoffFor: {
    fontFamily: LATIN_B,
    fontSize: 6.5,
    color: C.navy,
    textAlign: 'center',
    letterSpacing: 0.2,
    display: 'none',
  },
})

// ─── Row Entry ────────────────────────────────────────────────────────────────
interface RowEntry {
  sno: number
  particulars: string
  productName: string
  qty: number | null
  isMenuItem: boolean
  qtyDisplay: string
  rate: string
  total: string
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
interface BillDocProps {
  data: BillDataWithId
  type: BillType
  meta: BillMeta
}

const BillDoc: React.FC<BillDocProps> = ({ data, type, meta }) => {
  const customerItems: BillCustomerItem[] = data.customerItems ?? []
  const rawMaterials: BillRawMaterial[] = data.rawMaterials ?? []
  const customer = (data.customer ?? {}) as BillCustomerInfo

  const getDateWithDay = (dateStr?: string): string => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yyyy = date.getFullYear()
      return `${dd}${mm}${yyyy}`
    } catch {
      return dateStr
    }
  }
  
  const resolvedDate = getDateWithDay(meta.date ?? customer.eventDate ?? undefined)
  const resolvedTime = meta.time ?? customer.eventTime?.slice(0, 5) ?? undefined // "07:00:00" → "07:00"
  const resolvedAdvance =
    meta.advance ??
    (data.advanceAmount != null
      ? `Rs. ${fmtMoney(data.advanceAmount)}`
      : undefined)
  const resolvedDeliveryCharge = data.deliveryCharge != null ? fmtMoney(data.deliveryCharge) : '0.00'
  const summary = data as BillSummary
  const billTitle = resolveBillTitle(type)

  const totalValue: number | null | undefined =
    summary.totalAmount ??
    (type === 'STAFF'
      ? summary.customerItemsTotal
      : customerItems.reduce((acc, item) => acc + (item.lineTotal ?? 0), 0))

  // Build rows from customerItems
  const rows: RowEntry[] = customerItems.map((item, i) => {
    const qty = item.quantity ?? null
    const isMenuItem = item.isMenuItem === true
    const qtyDisplay = qty != null ? String(qty) : '—'
    return {
      sno: i + 1,
      particulars: item.productName ?? '—',
      productName: item.productName ?? '—',
      qty,
      isMenuItem,
      qtyDisplay,
      rate: item.unitPrice != null ? String(item.unitPrice) : '—',
      total: (item.lineTotal ?? null) != null ? fmtMoney(item.lineTotal) : '—',
    }
  })

  // Minimum 14 visible rows so the table looks full
  const MIN_ROWS = 14
  const emptyCount = Math.max(0, MIN_ROWS - rows.length)
  const emptyRows = Array.from({ length: emptyCount })

  return (
    <Document>
      <Page size="A5" style={s.page}>
        <View style={s.card}>
          {/* ── Header Band ──────────────────────────────────────────────── */}
          <View style={s.headerBand}>
            {/* Logo */}
            <View style={s.logoSection}>
              <Image
                src="/Images/logo.jpg"
                style={{ width: 36, height: 36, objectFit: 'contain' }}
              />
            </View>

            {/* Business name */}
            <View style={s.businessSection}>
              <Text style={s.businessName}>VENKATESHWARA</Text>
              <Text style={s.businessSub}>MESS & CATERING</Text>
            </View>
          </View>

          {/* ── Meta Strip: Bill type + No + Address ────────────────────── */}
          <View style={s.metaStrip}>
            <View style={s.billTypePill}>
              <Text style={s.billTypePillText}>{billTitle}</Text>
            </View>
            <Text style={s.billNoLabel}>No.</Text>
            <Text style={s.billNoValue}>{data.orderId ?? '—'}</Text>
            <Text style={s.addressText}>
              Pattanam Road, Vellalore, Coimbatore – 641 111
            </Text>
          </View>

          {/* ── Customer Info ─────────────────────────────────────────────── */}
          <View style={s.customerSection}>
            <View style={s.customerLeft}>
              {/* To */}
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>To</Text>
                <Text style={s.infoColon}>:</Text>
                <Text style={s.infoValueTamil}>
                  {dot(meta.to ?? customer.customerName)}
                </Text>
              </View>

              {/* M/s */}
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Address</Text>
                <Text style={s.infoColon}>:</Text>
                <Text style={s.infoValueTamil}>
                  {dot(meta.ms ?? customer.customerAddress)}
                </Text>
              </View>

              {/* Cell / Advance — inline */}
              <View style={s.infoRowInline}>
                {/* Customer No removed as requested */}
                <View style={s.infoGroup}>
                  <Text style={s.infoLabel}>Cell No</Text>
                  <Text style={s.infoColon}>:</Text>
                  <Text style={s.infoValue}>
                    {dot(meta.cellNo ?? customer.customerPhone)}
                  </Text>
                </View>
                <View style={s.infoGroup}>
                  <Text style={s.infoLabel}>Advance</Text>
                  <Text style={s.infoColon}>:</Text>
                  <Text style={s.infoValue}>
                    {resolvedAdvance ?? '........'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Day / Date */}
            <View style={s.customerRight}>
              <View style={s.dateGroup}>
                <Text style={s.dateLabel}>Date</Text>
                <Text style={s.dateValue}>
                  {resolvedDate ?? '...............'}
                </Text>
              </View>
              <View style={s.dateGroup}>
                <Text style={s.dateLabel}>Time</Text>
                <Text style={s.dateValue}>
                  {resolvedTime ?? '...............'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Table ────────────────────────────────────────────────────── */}
          <View style={s.tableWrapper}>
            {/* Table Head */}
            <View style={s.tableHead}>
              <Text style={[s.th, s.colSno]}>S.No</Text>
              <Text style={[s.thLeft, s.colParticulars]}>Particulars</Text>
              <Text style={[s.th, s.colQty]}>QTY</Text>
              <Text style={[s.th, s.colRate]}>PRICE/UNIT</Text>
              {/* Amount split header */}
              <View
                style={[
                  s.colRs,
                  {
                    borderLeft: `0.25pt solid ${C.divider}`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 3,
                  },
                ]}
              >
                <Text
                  style={{ fontFamily: LATIN_B, fontSize: 7, color: C.navy }}
                >
                  Total Cost
                </Text>
              </View>
            </View>

            {/* Data rows */}
            {rows.map((row, i) => (
              <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={s.tdSno}>{row.sno}</Text>
                {/* Product name — always NotoSansTamil, fontFamily set inline to guarantee it */}
                <Text
                  style={[
                    s.tdParticulars,
                    { fontFamily: TAMIL, fontWeight: 'bold' },
                  ]}
                >
                  {row.particulars}
                </Text>
                <Text style={s.tdQty}>
                  {row.qty != null ? String(row.qty) : '—'}
                </Text>
                <Text style={s.tdRate}>
                  {type !== 'STAFF' ? row.rate : '—'}
                </Text>
                <Text style={s.tdRs}>{type !== 'STAFF' ? row.total : '—'}</Text>
              </View>
            ))}

            {/* Padding empty rows */}
            {emptyRows.map((_, i) => (
              <View
                key={`e-${i}`}
                style={(rows.length + i) % 2 === 0 ? s.tableRow : s.tableRowAlt}
              >
                <Text style={s.tdSno}> </Text>
                <Text style={[s.tdParticulars, { fontFamily: TAMIL }]}> </Text>
                <Text style={s.tdQty}> </Text>
                <Text style={s.tdRate}> </Text>
                <Text style={s.tdRs}> </Text>
              </View>
            ))}
          </View>

          {rawMaterials.length > 0 &&
            (type === 'STAFF' || type === 'OWNER') && (
              <RawMaterialsTable rawMaterials={rawMaterials} type={type} />
            )}

          {/* ── Footer: Total Amount & Cash to Collect ───────────────────────────────── */}
          {type === 'CUSTOMER' && (
            <View style={s.footerBar}>
              <View style={s.footerNoteCol} />
              <View style={{width: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 5, flexDirection: 'column', gap: 3}}>
                <View style={{alignItems: 'center', gap: 1}}>
                  <Text style={{fontFamily: LATIN_B, fontSize: 6, color: C.light, letterSpacing: 0.4}}>TOTAL AMOUNT</Text>
                  <Text style={{fontFamily: LATIN_B, fontSize: 10, color: C.navy}}>Rs. {fmtMoney(totalValue)}</Text>
                </View>
                <Text style={{fontFamily: LATIN, fontSize: 6, color: C.muted, textAlign: 'center'}}>Advance Amount: Rs. {fmtMoney(data.advanceAmount ?? 0)}</Text>
                <View style={{alignItems: 'center', gap: 2, paddingTop: 1}}>
                  <View style={{backgroundColor: C.navy, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 1}}>
                    <Text style={{fontFamily: LATIN_B, fontSize: 5.5, color: C.white, letterSpacing: 0.3}}>CASH TO COLLECT</Text>
                  </View>
                  <Text style={{fontFamily: LATIN_B, fontSize: 10, color: C.navy}}>Rs. {fmtMoney(Math.max(0, (totalValue ?? 0) - (data.advanceAmount ?? 0)))}</Text>
                </View>
              </View>
            </View>
          )}
          {type !== 'CUSTOMER' && (
            <View style={s.footerBar}>
              <View style={s.footerNoteCol} />
              <View style={s.footerTotalCol}>
                <View style={s.footerTotalChip}>
                  <Text style={s.footerTotalChipText}>TOTAL AMOUNT</Text>
                </View>
                <Text style={s.footerTotalValue}>Rs. {fmtMoney(totalValue)}</Text>
              </View>
            </View>
          )}

          {/* ── Signoff Bar ───────────────────────────────────────────────── */}
          <View style={s.signoffBar}>
            <View style={s.signoffLeft}>
              {type === 'OWNER' ? (
                <>
                  <Text style={s.signoffStat}>
                    Raw Material Cost: Rs.{' '}
                    {fmtMoney(summary.totalRawMaterialCost)}
                    {'   '}
                    Sub-Product Cost: Rs.{' '}
                    {fmtMoney(summary.totalSubProductCost)}
                  </Text>
                  <Text style={s.signoffStatBold}>
                    Net Profit: Rs. {fmtMoney(summary.profit)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={s.signoffStat}>
                    Items: {customerItems.length} | Delivery: Rs. {resolvedDeliveryCharge}
                  </Text>
                  {type === 'STAFF' && (
                    <Text style={s.signoffStatBold}>Internal Copy</Text>
                  )}
                </>
              )}
            </View>
              <View style={s.signoffRight}>
              </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

const RawMaterialsTable: React.FC<{
  rawMaterials: BillRawMaterial[]
  type: BillType
}> = ({ rawMaterials, type }) => {
  const isStaff = type === 'STAFF'

  return (
    <View style={s.rmSection}>
      {/* Section title bar */}
      <View style={s.rmSectionHeader}>
        <Text style={s.rmSectionTitle}>RAW MATERIALS</Text>
      </View>

      {/* Table head */}
      <View style={s.rmTableHead}>
        <Text style={[s.th, s.colSno]}>S.No</Text>
        <Text style={[s.thLeft, { flex: 1 }]}>Material</Text>
        {!isStaff && (
          <>
            <Text style={[s.th, s.colQty]}>QTY</Text>
            <Text style={[s.th, s.colRate]}>PRICE/UNIT</Text>
            <View
              style={[
                s.colRs,
                {
                  borderLeft: `0.25pt solid ${C.divider}`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 3,
                },
              ]}
            >
              <Text style={{ fontFamily: LATIN_B, fontSize: 7, color: C.navy }}>
                TOTAL COST
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Rows */}
      {rawMaterials.map((mat, i) => (
        <View key={i} style={i % 2 === 0 ? s.rmRow : s.rmRowAlt}>
          <Text style={s.tdSno}>{i + 1}</Text>
          <Text
            style={[
              s.tdParticulars,
              { flex: 1, fontFamily: TAMIL, fontWeight: 'bold' },
            ]}
          >
            {mat.rawMaterialName ?? '—'}
          </Text>
          {!isStaff && (
            <>
              <Text style={s.tdQty}>
                {mat.requiredQuantity != null
                  ? `${mat.requiredQuantity} ${mat.unit ?? ''}`.trim()
                  : '—'}
              </Text>
              <Text style={s.tdRate}>
                {mat.purchasePricePerUnit != null
                  ? `${fmtMoney(mat.purchasePricePerUnit)} / ${mat.purchaseUnit ?? mat.unit ?? 'unit'}`
                  : '—'}
              </Text>
              <Text style={s.tdRs}>
                {mat.totalCost != null ? fmtMoney(mat.totalCost) : '—'}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  )
}
// ─── Download Button Component ────────────────────────────────────────────────
interface DownloadBillButtonProps {
  orderId: number
  compact?: boolean
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
  compact = false,
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
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const [loadingType, setLoadingType] = useState<BillType | null>(null)

  // Recalculate dropdown position whenever it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: r.bottom + window.scrollY + 6,
        left: Math.max(8, r.right + window.scrollX - 236),
      })
    }
  }, [isOpen])

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
  const isAnyLoading = loadingType !== null

  const handleDownload = async (option: BillOption): Promise<void> => {
    setIsOpen(false)
    setLoadingType(option.type)
    try {
      const data = await fetchOrderBill(orderId, option.type)
      const blob = await pdf(
        <BillDoc data={{ ...data, orderId }} type={option.type} meta={meta} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-${orderId}-${option.type.toLowerCase()}-bill.pdf`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t('bill_downloaded_success', { billType: option.label }))
    } catch {
      toast.error(t('bill_downloaded_error', { billType: option.label }))
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={isAnyLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          'inline-flex cursor-pointer items-center font-semibold select-none',
          'border border-[#E4E4E7] bg-white text-[#18181B] shadow-sm',
          'transition-colors duration-150 hover:bg-[#F4F4F5] active:bg-[#E4E4E7]',
          'outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          compact
            ? 'gap-1 rounded-[6px] px-2 py-1.5 text-xs'
            : 'gap-2 rounded-xl px-3 py-2.5 text-sm',
          isAnyLoading ? 'cursor-not-allowed opacity-60' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isAnyLoading ? (
          <Loader2
            className={
              compact
                ? 'h-3 w-3 animate-spin text-zinc-400'
                : 'h-4 w-4 animate-spin text-zinc-400'
            }
          />
        ) : (
          <Download
            className={
              compact ? 'h-3 w-3 text-zinc-500' : 'h-4 w-4 text-zinc-500'
            }
          />
        )}
        <span>{t('download_bill')}</span>
        <ChevronDown
          className={[
            'text-zinc-400 transition-transform duration-150',
            compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {isOpen &&
        createPortal(
          <>
            {/* Click-away overlay */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 40,
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown panel */}
            <div
              style={{
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 50,
                width: '236px',
                backgroundColor: '#ffffff',
                border: '1px solid #E4E4E7',
                borderRadius: '10px',
                boxShadow:
                  '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Header label */}
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#9CA3AF',
                  }}
                >
                  {t('select_bill_type')}
                </span>
              </div>

              {/* Options list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: '4px 0' }}>
                {billOptions.map((option) => (
                  <li key={option.type}>
                    <button
                      type="button"
                      disabled={loadingType === option.type}
                      onClick={() => handleDownload(option)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        gap: '2px',
                        padding: '8px 14px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor:
                          loadingType === option.type
                            ? 'not-allowed'
                            : 'pointer',
                        opacity: loadingType === option.type ? 0.55 : 1,
                        transition: 'background-color 120ms',
                      }}
                      onMouseEnter={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = '#FEF9EC')
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLButtonElement
                        ).style.backgroundColor = 'transparent')
                      }
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#18181B',
                        }}
                      >
                        {loadingType === option.type ? (
                          <Loader2
                            style={{
                              width: 13,
                              height: 13,
                              color: '#F59E0B',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                        ) : (
                          <Download
                            style={{ width: 13, height: 13, color: '#F59E0B' }}
                          />
                        )}
                        {option.label}
                      </span>
                      <span
                        style={{
                          paddingLeft: '19px',
                          fontSize: '11px',
                          color: '#9CA3AF',
                        }}
                      >
                        {option.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* CSS keyframes for spinner */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          </>,
          document.body
        )}
    </>
  )
}

export default DownloadBillButton
