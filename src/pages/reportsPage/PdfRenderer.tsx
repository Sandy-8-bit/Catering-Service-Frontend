import { useState, useEffect, type FC, type MouseEvent } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadLink,
} from '@react-pdf/renderer'

import TamilFontLocal from '/fonts/NotoSansTamil.ttf'

// Register both weights so bold Tamil works in PDF
Font.register({
  family: 'NotoSansTamil',
  fonts: [
    { src: TamilFontLocal, fontWeight: 'normal' },
    { src: TamilFontLocal, fontWeight: 'bold' },
  ],
})

// ─── Responsive hook ──────────────────────────────────────────────────────────
const useWindowWidth = (): number => {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawMaterial {
  name: string
  quantity: number
  unit: string
  cost: number
}

export interface MenuItem {
  productName: string
  productSecondaryName: string | null
  quantity: number
  productUnitPrice: number
  productLineTotal: number
  productRawMaterialCost: number
  productProfit: number
  rawMaterials: RawMaterial[]
  perPlate: number
}

export interface AdditionalItem {
  name?: string
  productName?: string
  amount?: number
  productLineTotal?: number
}

export interface OrderDetail {
  orderId: number
  customerName: string
  eventDate: string
  totalPeople: number
  orderIncome: number
  orderExpense: number
  orderProfit: number
  menuItems: MenuItem[]
  additionalMenuItems: MenuItem[]
  additionalItems: AdditionalItem[]
  rawMaterialUsage: string | null
}

export interface ReportData {
  totalGlobalIncome: number
  totalGlobalMiscExpense: number
  totalGlobalNetProfit: number
  totalGlobalPeopleServed: number
  orderDetails: OrderDetail[]
}

export interface ReportResponse {
  success: boolean
  message: string
  data: ReportData
  timestamp: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number): string => {
  const number = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
  return `Rs. ${number}`
}

const fmtDate = (d: string): string =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const fmtTimestamp = (ts: string): string =>
  new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// ─── Color tokens ─────────────────────────────────────────────────────────────
const INDIGO = '#4338CA'
const INDIGO_DARK = '#3730A3'
const INDIGO_LIGHT = '#EEF2FF'
const GRAY_50 = '#F9FAFB'
const GRAY_100 = '#F3F4F6'
const GRAY_200 = '#E5E7EB'
const GRAY_500 = '#6B7280'
const GRAY_700 = '#374151'
const GRAY_900 = '#111827'
const WHITE = '#FFFFFF'
const GREEN = '#059669'
const RED = '#DC2626'

// ─── Font stack for HTML preview ──────────────────────────────────────────────
const PREVIEW_FONT =
  "'Noto Sans Tamil', 'Latha', 'Vijaya', 'Helvetica Neue', Helvetica, Arial, sans-serif"

// ─── PDF Styles ───────────────────────────────────────────────────────────────
const pdfStyles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    // DO NOT set fontFamily here — let each Text node declare its own font.
    // A page-level Helvetica default silently overrides NotoSansTamil on any
    // Text that doesn't explicitly set its own fontFamily.
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontSize: 9,
    color: GRAY_700,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: INDIGO,
  },
  logoBlock: { flexDirection: 'column', gap: 2 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: INDIGO,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: WHITE, fontSize: 14, fontFamily: 'Helvetica-Bold' },
  companyName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  companyTagline: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500, marginTop: 1 },
  reportMeta: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: INDIGO, letterSpacing: 1 },
  reportSubtitle: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500, marginTop: 3 },
  reportDate: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_700, marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: GRAY_50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: GRAY_200 },
  summaryCardAccent: { flex: 1, backgroundColor: INDIGO, borderRadius: 6, padding: 12 },
  summaryLabel: { fontSize: 7, fontFamily: 'Helvetica', color: GRAY_500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryLabelLight: { fontSize: 7, fontFamily: 'Helvetica', color: '#A5B4FC', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  summaryValueLight: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: WHITE },
  summaryValueGreen: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN },
  summaryValueRed: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: RED },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INDIGO_DARK, marginBottom: 10, marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: INDIGO, borderRadius: 4, paddingVertical: 7, paddingHorizontal: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: GRAY_100 },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: GRAY_50, borderBottomWidth: 1, borderBottomColor: GRAY_100 },
  thText: { color: WHITE, fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Latin text cells (numbers, dates, IDs)
  tdText: { fontFamily: 'Helvetica', color: GRAY_700, fontSize: 8 },
  tdTextBold: { fontFamily: 'Helvetica-Bold', color: GRAY_900, fontSize: 8 },
  tdTextGreen: { fontFamily: 'Helvetica-Bold', color: GREEN, fontSize: 8 },

  // ─── Tamil text cells ───────────────────────────────────────────────────────
  // productName and any Tamil string MUST use these — never Helvetica variants
  tdTamil: {
    fontFamily: 'NotoSansTamil',
    fontWeight: 'bold',   // maps to the bold src registered above
    color: GRAY_900,
    fontSize: 8,
  },
  tdTamilSub: {
    fontFamily: 'NotoSansTamil',
    fontWeight: 'normal',
    color: GRAY_500,
    fontSize: 7,
    marginTop: 1,
  },
  // ────────────────────────────────────────────────────────────────────────────

  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  colProfit: { flex: 1.5, textAlign: 'right' },
  colPerPlate: { flex: 1.5, textAlign: 'right' },
  colRawCost: { flex: 1.5, textAlign: 'right' },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  orderSummaryBox: { width: 220, backgroundColor: GRAY_50, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: GRAY_200 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLineKey: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500 },
  summaryLineVal: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY_700 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: GRAY_200, paddingTop: 6, marginTop: 4 },
  totalKey: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  totalVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: INDIGO },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: GRAY_200, paddingTop: 8 },
  footerText: { fontSize: 7, fontFamily: 'Helvetica', color: GRAY_500 },
  orderBanner: { backgroundColor: INDIGO_LIGHT, borderRadius: 6, padding: 12, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: INDIGO },
  orderBannerLeft: {},
  orderBannerRight: { alignItems: 'flex-end' },
  orderBannerTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INDIGO_DARK },
  orderBannerSub: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500, marginTop: 2 },
  badge: { backgroundColor: INDIGO, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  badgeText: { color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  emptyRow: { padding: 12, alignItems: 'center' },
  emptyText: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500, fontStyle: 'italic' },
  thankyou: { marginTop: 20, padding: 14, backgroundColor: INDIGO_LIGHT, borderRadius: 6, alignItems: 'center' },
  thankyouText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INDIGO, marginBottom: 3 },
  thankyouSub: { fontSize: 8, fontFamily: 'Helvetica', color: GRAY_500 },
})

// ─── PDF: Summary Page ────────────────────────────────────────────────────────

interface SummaryPageProps {
  data: ReportData
  timestamp: string
  message: string
}

const SummaryPage: FC<SummaryPageProps> = ({ data, timestamp, message }) => (
  <Page size="A4" style={pdfStyles.page}>
    <View style={pdfStyles.header}>
      <View style={pdfStyles.logoBlock}>
        <View style={pdfStyles.logoCircle}>
          <Text style={pdfStyles.logoText}>B</Text>
        </View>
        <Text style={pdfStyles.companyName}>Business Name.</Text>
        <Text style={pdfStyles.companyTagline}>Catering & Events Management</Text>
      </View>
      <View style={pdfStyles.reportMeta}>
        <Text style={pdfStyles.reportTitle}>REPORT</Text>
        <Text style={pdfStyles.reportSubtitle}>{message}</Text>
        <Text style={pdfStyles.reportDate}>Generated: {fmtTimestamp(timestamp)}</Text>
      </View>
    </View>

    <Text style={pdfStyles.sectionTitle}>Global Summary</Text>
    <View style={pdfStyles.summaryRow}>
      <View style={pdfStyles.summaryCard}>
        <Text style={pdfStyles.summaryLabel}>Total Income</Text>
        <Text style={pdfStyles.summaryValue}>{fmt(data.totalGlobalIncome)}</Text>
      </View>
      <View style={pdfStyles.summaryCard}>
        <Text style={pdfStyles.summaryLabel}>Misc Expenses</Text>
        <Text style={data.totalGlobalMiscExpense > 0 ? pdfStyles.summaryValueRed : pdfStyles.summaryValue}>
          {fmt(data.totalGlobalMiscExpense)}
        </Text>
      </View>
      <View style={pdfStyles.summaryCardAccent}>
        <Text style={pdfStyles.summaryLabelLight}>Net Profit</Text>
        <Text style={pdfStyles.summaryValueLight}>{fmt(data.totalGlobalNetProfit)}</Text>
      </View>
      <View style={pdfStyles.summaryCard}>
        <Text style={pdfStyles.summaryLabel}>People Served</Text>
        <Text style={pdfStyles.summaryValue}>{data.totalGlobalPeopleServed}</Text>
      </View>
    </View>

    <Text style={pdfStyles.sectionTitle}>Orders Overview</Text>
    <View style={pdfStyles.tableHeader}>
      <Text style={[pdfStyles.thText, { flex: 0.5 }]}>#</Text>
      <Text style={[pdfStyles.thText, { flex: 2 }]}>Customer</Text>
      <Text style={[pdfStyles.thText, { flex: 1.5 }]}>Event Date</Text>
      <Text style={[pdfStyles.thText, { flex: 1, textAlign: 'right' }]}>People</Text>
      <Text style={[pdfStyles.thText, { flex: 1.5, textAlign: 'right' }]}>Income</Text>
      <Text style={[pdfStyles.thText, { flex: 1.5, textAlign: 'right' }]}>Expense</Text>
      <Text style={[pdfStyles.thText, { flex: 1.5, textAlign: 'right' }]}>Profit</Text>
    </View>
    {data.orderDetails.map((o, i) => (
      <View key={o.orderId} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
        <Text style={[pdfStyles.tdText, { flex: 0.5 }]}>{o.orderId}</Text>
        <Text style={[pdfStyles.tdTextBold, { flex: 2 }]}>{o.customerName}</Text>
        <Text style={[pdfStyles.tdText, { flex: 1.5 }]}>{fmtDate(o.eventDate)}</Text>
        <Text style={[pdfStyles.tdText, { flex: 1, textAlign: 'right' }]}>{o.totalPeople}</Text>
        <Text style={[pdfStyles.tdText, { flex: 1.5, textAlign: 'right' }]}>{fmt(o.orderIncome)}</Text>
        <Text style={[pdfStyles.tdText, { flex: 1.5, textAlign: 'right' }]}>{fmt(o.orderExpense)}</Text>
        <Text style={[pdfStyles.tdTextGreen, { flex: 1.5, textAlign: 'right' }]}>{fmt(o.orderProfit)}</Text>
      </View>
    ))}

    <View style={pdfStyles.thankyou}>
      <Text style={pdfStyles.thankyouText}>Thank you for your Business</Text>
      <Text style={pdfStyles.thankyouSub}>Detailed order breakdown on the following pages</Text>
    </View>

    <View style={pdfStyles.footer}>
      <Text style={pdfStyles.footerText}>Confidential Financial Report</Text>
      <Text style={pdfStyles.footerText}>Page 1 of {data.orderDetails.length + 1}</Text>
    </View>
  </Page>
)

// ─── PDF: Menu Items Table ────────────────────────────────────────────────────

interface MenuItemsTableProps {
  items: MenuItem[]
  title: string
}

const MenuItemsTable: FC<MenuItemsTableProps> = ({ items, title }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRAY_700, marginBottom: 6 }}>
      {title}
    </Text>
    <View style={pdfStyles.tableHeader}>
      <Text style={[pdfStyles.thText, pdfStyles.colProduct]}>Product</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colQty]}>Qty</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colUnit]}>Unit Price</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colPerPlate]}>Per Plate</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colRawCost]}>Raw Cost</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colTotal]}>Line Total</Text>
      <Text style={[pdfStyles.thText, pdfStyles.colProfit]}>Profit</Text>
    </View>
    {items.length === 0 ? (
      <View style={pdfStyles.emptyRow}>
        <Text style={pdfStyles.emptyText}>No items</Text>
      </View>
    ) : (
      items.map((item, i) => (
        <View key={i} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
          <View style={pdfStyles.colProduct}>
            {/* productName is Tamil — must use tdTamil, never tdTextBold */}
            <Text style={pdfStyles.tdTamil}>{item.productName}</Text>
            {item.productSecondaryName && (
              <Text style={pdfStyles.tdTamilSub}>{item.productSecondaryName}</Text>
            )}
          </View>
          {/* All numeric/latin cells use Helvetica */}
          <Text style={[pdfStyles.tdText, pdfStyles.colQty]}>{item.quantity}</Text>
          <Text style={[pdfStyles.tdText, pdfStyles.colUnit]}>{fmt(item.productUnitPrice)}</Text>
          <Text style={[pdfStyles.tdText, pdfStyles.colPerPlate]}>{fmt(item.perPlate)}</Text>
          <Text style={[pdfStyles.tdText, pdfStyles.colRawCost]}>{fmt(item.productRawMaterialCost)}</Text>
          <Text style={[pdfStyles.tdTextBold, pdfStyles.colTotal]}>{fmt(item.productLineTotal)}</Text>
          <Text style={[pdfStyles.tdTextGreen, pdfStyles.colProfit]}>{fmt(item.productProfit)}</Text>
        </View>
      ))
    )}
  </View>
)

// ─── PDF: Order Page ──────────────────────────────────────────────────────────

interface OrderPageProps {
  order: OrderDetail
  pageNum: number
  totalPages: number
}

const OrderPage: FC<OrderPageProps> = ({ order, pageNum, totalPages }) => (
  <Page size="A4" style={pdfStyles.page}>
    <View style={pdfStyles.header}>
      <View style={pdfStyles.logoBlock}>
        <View style={pdfStyles.logoCircle}>
          <Text style={pdfStyles.logoText}>B</Text>
        </View>
        <Text style={pdfStyles.companyName}>Business Name.</Text>
        <Text style={pdfStyles.companyTagline}>Catering & Events Management</Text>
      </View>
      <View style={pdfStyles.reportMeta}>
        <Text style={pdfStyles.reportTitle}>ORDER</Text>
        <Text style={pdfStyles.reportSubtitle}>#{order.orderId} — Detailed Breakdown</Text>
        <Text style={pdfStyles.reportDate}>{fmtDate(order.eventDate)}</Text>
      </View>
    </View>

    <View style={pdfStyles.orderBanner}>
      <View style={pdfStyles.orderBannerLeft}>
        <Text style={pdfStyles.orderBannerTitle}>{order.customerName}</Text>
        <Text style={pdfStyles.orderBannerSub}>Event Date: {fmtDate(order.eventDate)}</Text>
        <Text style={pdfStyles.orderBannerSub}>Total People Served: {order.totalPeople}</Text>
        {order.rawMaterialUsage && (
          <Text style={pdfStyles.orderBannerSub}>Raw Material Usage: {order.rawMaterialUsage}</Text>
        )}
      </View>
      <View style={pdfStyles.orderBannerRight}>
        <View style={pdfStyles.badge}>
          <Text style={pdfStyles.badgeText}>ORDER #{order.orderId}</Text>
        </View>
        <Text style={[pdfStyles.orderBannerSub, { textAlign: 'right' }]}>Income: {fmt(order.orderIncome)}</Text>
        <Text style={[pdfStyles.orderBannerSub, { textAlign: 'right' }]}>Expense: {fmt(order.orderExpense)}</Text>
      </View>
    </View>

    <MenuItemsTable items={order.menuItems} title="Menu Items (Per Plate)" />

    {order.additionalMenuItems?.length > 0 && (
      <MenuItemsTable items={order.additionalMenuItems} title="Additional Menu Items" />
    )}

    {order.additionalItems?.length > 0 && (
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: GRAY_700, marginBottom: 6 }}>
          Additional Items
        </Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.thText, { flex: 3 }]}>Item</Text>
          <Text style={[pdfStyles.thText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
        </View>
        {order.additionalItems.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt}>
            {/* item name may be Tamil */}
            <Text style={[pdfStyles.tdTamil, { flex: 3 }]}>
              {item.name ?? item.productName ?? 'Item'}
            </Text>
            <Text style={[pdfStyles.tdTextBold, { flex: 1, textAlign: 'right' }]}>
              {fmt(item.amount ?? item.productLineTotal ?? 0)}
            </Text>
          </View>
        ))}
      </View>
    )}

    <View style={pdfStyles.orderSummaryRow}>
      <View style={pdfStyles.orderSummaryBox}>
        <View style={pdfStyles.summaryLine}>
          <Text style={pdfStyles.summaryLineKey}>Order Income</Text>
          <Text style={pdfStyles.summaryLineVal}>{fmt(order.orderIncome)}</Text>
        </View>
        <View style={pdfStyles.summaryLine}>
          <Text style={pdfStyles.summaryLineKey}>Order Expense</Text>
          <Text style={[pdfStyles.summaryLineVal, { color: order.orderExpense > 0 ? RED : GRAY_700 }]}>
            {fmt(order.orderExpense)}
          </Text>
        </View>
        <View style={pdfStyles.totalLine}>
          <Text style={pdfStyles.totalKey}>Net Profit</Text>
          <Text style={pdfStyles.totalVal}>{fmt(order.orderProfit)}</Text>
        </View>
      </View>
    </View>

    <View style={pdfStyles.footer}>
      <Text style={pdfStyles.footerText}>Confidential Financial Report</Text>
      <Text style={pdfStyles.footerText}>Page {pageNum} of {totalPages}</Text>
    </View>
  </Page>
)

// ─── PDF: Document ────────────────────────────────────────────────────────────

interface ReportDocumentProps {
  reportData: ReportResponse
}

const ReportDocument: FC<ReportDocumentProps> = ({ reportData }) => {
  const { data, timestamp, message } = reportData
  const totalPages = data.orderDetails.length + 1
  return (
    <Document>
      <SummaryPage data={data} timestamp={timestamp} message={message} />
      {data.orderDetails.map((order, i) => (
        <OrderPage key={order.orderId} order={order} pageNum={i + 2} totalPages={totalPages} />
      ))}
    </Document>
  )
}

// ─── Preview: StatCard ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  accent?: boolean
  green?: boolean
  red?: boolean
}

const StatCard: FC<StatCardProps> = ({ label, value, accent = false, green = false, red = false }) => (
  <div style={{ flex: 1, minWidth: 120, borderRadius: 10, padding: '16px 18px', backgroundColor: accent ? INDIGO : '#F9FAFB', border: accent ? 'none' : '1px solid #E5E7EB' }}>
    <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent ? '#A5B4FC' : '#6B7280', fontWeight: 600, margin: '0 0 6px 0' }}>
      {label}
    </p>
    <p style={{ fontSize: 20, fontWeight: 800, color: accent ? '#FFFFFF' : green ? GREEN : red ? RED : '#111827', margin: 0, lineHeight: 1.2 }}>
      {value}
    </p>
  </div>
)

// ─── Shared preview page container style ──────────────────────────────────────
const pageContainerStyle = (isMobile: boolean): React.CSSProperties => ({
  width: '100%',
  ...(isMobile ? {} : { aspectRatio: '210 / 297' }),
  backgroundColor: '#FFFFFF',
  padding: isMobile ? '20px 16px' : '40px',
  boxSizing: 'border-box',
  fontFamily: PREVIEW_FONT,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  marginBottom: 20,
})

// ─── Preview: Summary Page ────────────────────────────────────────────────────

interface PreviewSummaryPageProps {
  data: ReportData
  timestamp: string
  message: string
  isMobile: boolean
}

const PreviewSummaryPage: FC<PreviewSummaryPageProps> = ({ data, timestamp, message, isMobile }) => (
  <div style={pageContainerStyle(isMobile)}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: `2px solid ${INDIGO}`, marginBottom: 28 }}>
      <div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>B</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>Business Name.</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: 0 }}>Catering & Events Management</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 28, fontWeight: 900, color: INDIGO, margin: '0 0 4px 0', letterSpacing: 2 }}>REPORT</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: '0 0 2px 0' }}>{message}</p>
        <p style={{ fontSize: 9, color: '#374151', margin: 0 }}>Generated: {fmtTimestamp(timestamp)}</p>
      </div>
    </div>

    <p style={{ fontSize: 13, fontWeight: 800, color: INDIGO_DARK, margin: '0 0 12px 0' }}>Global Summary</p>
    <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
      <StatCard label="Total Income" value={fmt(data.totalGlobalIncome)} />
      <StatCard label="Misc Expenses" value={fmt(data.totalGlobalMiscExpense)} red={data.totalGlobalMiscExpense > 0} />
      <StatCard label="Net Profit" value={fmt(data.totalGlobalNetProfit)} accent />
      <StatCard label="People Served" value={data.totalGlobalPeopleServed} />
    </div>

    <p style={{ fontSize: 13, fontWeight: 800, color: INDIGO_DARK, margin: '0 0 10px 0' }}>Orders Overview</p>
    <div style={{ overflowX: 'auto', marginBottom: 28 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 480 }}>
        <thead>
          <tr style={{ backgroundColor: INDIGO, color: '#fff' }}>
            {(['#', 'Customer', 'Event Date', 'People', 'Income', 'Expense', 'Profit'] as const).map((h) => (
              <th key={h} style={{ padding: '8px 10px', fontWeight: 700, textAlign: (h === '#' || h === 'Customer' || h === 'Event Date') ? 'left' : 'right', fontSize: 9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.orderDetails.map((o, i) => (
            <tr key={o.orderId} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
              <td style={{ padding: '8px 10px', color: '#6B7280', fontSize: 9 }}>{o.orderId}</td>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#111827', fontSize: 9 }}>{o.customerName}</td>
              <td style={{ padding: '8px 10px', color: '#374151', fontSize: 9 }}>{fmtDate(o.eventDate)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151', fontSize: 9 }}>{o.totalPeople}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151', fontSize: 9 }}>{fmt(o.orderIncome)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151', fontSize: 9 }}>{fmt(o.orderExpense)}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', color: GREEN, fontWeight: 700, fontSize: 9 }}>{fmt(o.orderProfit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ marginTop: 'auto', backgroundColor: INDIGO_LIGHT, borderRadius: 8, padding: '14px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: INDIGO, margin: '0 0 3px 0' }}>Thank you for your Business</p>
      <p style={{ fontSize: 9, color: '#6B7280', margin: 0 }}>Detailed order breakdown on the following pages</p>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 16 }}>
      <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0 }}>Confidential Financial Report</p>
      <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0 }}>Page 1 of {data.orderDetails.length + 1}</p>
    </div>
  </div>
)

// ─── Preview: Menu Table ──────────────────────────────────────────────────────

interface PreviewMenuTableProps {
  items: MenuItem[]
  title: string
}

const PreviewMenuTable: FC<PreviewMenuTableProps> = ({ items, title }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={{ fontSize: 10, fontWeight: 700, color: GRAY_700, margin: '0 0 8px 0' }}>{title}</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, minWidth: 520 }}>
        <thead>
          <tr style={{ backgroundColor: INDIGO, color: '#fff' }}>
            {(['Product', 'Qty', 'Unit Price', 'Per Plate', 'Raw Cost', 'Line Total', 'Profit'] as const).map((h) => (
              <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Product' ? 'left' : 'right', fontWeight: 700, fontSize: 8 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 12, textAlign: 'center', color: '#9CA3AF', fontSize: 9, fontStyle: 'italic' }}>No items</td>
            </tr>
          ) : (
            items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                <td style={{ padding: '7px 8px', fontSize: 9 }}>
                  {/* fontFamily in the td lets Noto Sans Tamil resolve Tamil glyphs in browser */}
                  <span style={{ fontWeight: 700, color: '#111827', fontFamily: PREVIEW_FONT }}>{item.productName}</span>
                  {item.productSecondaryName && (
                    <span style={{ display: 'block', fontWeight: 400, color: '#6B7280', fontSize: 8, fontFamily: PREVIEW_FONT }}>
                      {item.productSecondaryName}
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: GRAY_700, fontSize: 9 }}>{item.quantity}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: GRAY_700, fontSize: 9 }}>{fmt(item.productUnitPrice)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: GRAY_700, fontSize: 9 }}>{fmt(item.perPlate)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', color: GRAY_700, fontSize: 9 }}>{fmt(item.productRawMaterialCost)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#111827', fontSize: 9 }}>{fmt(item.productLineTotal)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: GREEN, fontSize: 9 }}>{fmt(item.productProfit)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)

// ─── Preview: Order Page ──────────────────────────────────────────────────────

interface PreviewOrderPageProps {
  order: OrderDetail
  pageNum: number
  totalPages: number
  isMobile: boolean
}

const PreviewOrderPage: FC<PreviewOrderPageProps> = ({ order, pageNum, totalPages, isMobile }) => (
  <div style={pageContainerStyle(isMobile)}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: `2px solid ${INDIGO}`, marginBottom: 24 }}>
      <div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: INDIGO, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>B</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>Business Name.</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: 0 }}>Catering & Events Management</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 28, fontWeight: 900, color: INDIGO, margin: '0 0 4px 0', letterSpacing: 2 }}>ORDER</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: '0 0 2px 0' }}>#{order.orderId} — Detailed Breakdown</p>
        <p style={{ fontSize: 9, color: '#374151', margin: 0 }}>{fmtDate(order.eventDate)}</p>
      </div>
    </div>

    <div style={{ backgroundColor: INDIGO_LIGHT, borderRadius: 8, padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${INDIGO}` }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: INDIGO_DARK, margin: '0 0 3px 0' }}>{order.customerName}</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: '0 0 2px 0' }}>Event Date: {fmtDate(order.eventDate)}</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: 0 }}>Total People Served: {order.totalPeople}</p>
        {order.rawMaterialUsage && (
          <p style={{ fontSize: 9, color: '#6B7280', margin: '2px 0 0 0' }}>Raw Material Usage: {order.rawMaterialUsage}</p>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ display: 'inline-block', backgroundColor: INDIGO, color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 8, fontWeight: 700, marginBottom: 6 }}>
          ORDER #{order.orderId}
        </span>
        <p style={{ fontSize: 9, color: '#6B7280', margin: '0 0 2px 0' }}>Income: {fmt(order.orderIncome)}</p>
        <p style={{ fontSize: 9, color: '#6B7280', margin: 0 }}>Expense: {fmt(order.orderExpense)}</p>
      </div>
    </div>

    <PreviewMenuTable items={order.menuItems} title="Menu Items (Per Plate)" />
    {order.additionalMenuItems?.length > 0 && (
      <PreviewMenuTable items={order.additionalMenuItems} title="Additional Menu Items" />
    )}

    {order.additionalItems?.length > 0 && (
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: GRAY_700, margin: '0 0 8px 0' }}>Additional Items</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, minWidth: 280 }}>
            <thead>
              <tr style={{ backgroundColor: INDIGO, color: '#fff' }}>
                <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700, fontSize: 8 }}>Item</th>
                <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontSize: 8 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.additionalItems.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={{ padding: '7px 8px', color: GRAY_700, fontSize: 9, fontFamily: PREVIEW_FONT }}>
                    {item.name ?? item.productName ?? 'Item'}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#111827', fontSize: 9 }}>
                    {fmt(item.amount ?? item.productLineTotal ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
      <div style={{ width: 220, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, border: '1px solid #E5E7EB' }}>
        {([
          { k: 'Order Income', v: fmt(order.orderIncome), red: false },
          { k: 'Order Expense', v: fmt(order.orderExpense), red: order.orderExpense > 0 },
        ] as { k: string; v: string; red: boolean }[]).map(({ k, v, red }) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: '#6B7280' }}>{k}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: red ? RED : GRAY_700 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#111827' }}>Net Profit</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: INDIGO }}>{fmt(order.orderProfit)}</span>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8, marginTop: 16 }}>
      <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0 }}>Confidential Financial Report</p>
      <p style={{ fontSize: 8, color: '#9CA3AF', margin: 0 }}>Page {pageNum} of {totalPages}</p>
    </div>
  </div>
)

// ─── Download Button ──────────────────────────────────────────────────────────

interface DownloadButtonProps {
  reportData: ReportResponse
}

const DownloadButton: FC<DownloadButtonProps> = ({ reportData }) => {
  const [ready, setReady] = useState<boolean>(false)
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.transform = 'translateY(-2px)'
    e.currentTarget.style.boxShadow = '0 12px 32px rgba(67,56,202,0.45)'
  }

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = '0 8px 24px rgba(67,56,202,0.35)'
  }

  const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
  )

  const baseButtonStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', borderRadius: 50,
    padding: isMobile ? '12px 18px' : '14px 24px', fontSize: isMobile ? 12 : 13, fontWeight: 700,
    boxShadow: '0 8px 24px rgba(67,56,202,0.35)', fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', bottom: isMobile ? 24 : 96, right: isMobile ? 16 : 96, zIndex: 50 }}>
      {!ready ? (
        <button disabled style={{ ...baseButtonStyle, backgroundColor: INDIGO, cursor: 'not-allowed', opacity: 0.7 }}>
          <DownloadIcon />
          Preparing PDF…
        </button>
      ) : (
        <PDFDownloadLink
          document={<ReportDocument reportData={reportData} />}
          fileName={`financial-report-${new Date().toISOString().slice(0, 10)}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <button
              style={{ ...baseButtonStyle, backgroundColor: loading ? '#6366F1' : INDIGO, cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <DownloadIcon />
              {loading ? 'Generating…' : 'Download PDF'}
            </button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FinancialReportProps {
  reportData: ReportResponse
}

export default function FinancialReport({ reportData }: FinancialReportProps) {
  const { data, timestamp, message } = reportData
  const totalPages = data.orderDetails.length + 1
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EEF2FF', padding: isMobile ? '20px 12px' : '40px 20px', fontFamily: PREVIEW_FONT }}>
      <div style={{ maxWidth: 1100, margin: '0 auto 28px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0, justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#111827', margin: '0 0 2px 0' }}>Financial Report</h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{message} · {fmtTimestamp(timestamp)}</p>
        </div>
        <span style={{ backgroundColor: INDIGO, color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700 }}>
          {totalPages} pages
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PreviewSummaryPage data={data} timestamp={timestamp} message={message} isMobile={isMobile} />
        {data.orderDetails.map((order, i) => (
          <PreviewOrderPage key={order.orderId} order={order} pageNum={i + 2} totalPages={totalPages} isMobile={isMobile} />
        ))}
      </div>

      <DownloadButton reportData={reportData} />
    </div>
  )
}