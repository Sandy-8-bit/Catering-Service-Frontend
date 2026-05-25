import { useState, useEffect, type FC } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadLink,
  Image,
} from '@react-pdf/renderer'

import TamilFontLocal from '/fonts/NotoSansTamil.ttf'
import { DownloadCloudIcon } from 'lucide-react'

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

const fmt = (n: number): string =>
  `Rs. ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`

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

const PREVIEW_FONT =
  "'Noto Sans Tamil', 'Latha', 'Vijaya', 'Helvetica Neue', Helvetica, Arial, sans-serif"

// ─── PDF Styles (A5: 148×210mm) ───────────────────────────────────────────────
// A5 is ~70% the area of A4. Base font 9→7.5, headers scale accordingly.

const pdf = StyleSheet.create({
  page: {
    size: 'A5',
    backgroundColor: WHITE,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
    fontSize: 8,
    color: GRAY_700,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: INDIGO,
  },
  logoSection: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: `0.5pt solid rgba(255,255,255,0.2)`,
    paddingVertical: 6,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: INDIGO,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: WHITE, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  companyName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  companyTag: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    marginTop: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: INDIGO,
    letterSpacing: 1,
  },
  reportSub: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    marginTop: 2,
  },
  reportDate: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: GRAY_700,
    marginTop: 2,
  },
  // ── Summary cards ──
  summaryRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  card: {
    flex: 1,
    backgroundColor: GRAY_50,
    borderRadius: 5,
    padding: 9,
    borderWidth: 1,
    borderColor: GRAY_200,
  },
  cardAccent: { flex: 1, backgroundColor: INDIGO, borderRadius: 5, padding: 9 },
  cardLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardLabelLight: {
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: '#A5B4FC',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  cardValueLight: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WHITE },
  cardValueGreen: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: GREEN },
  cardValueRed: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: RED },
  // ── Section title ──
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: INDIGO_DARK,
    marginBottom: 7,
    marginTop: 3,
  },
  // ── Table ──
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: INDIGO,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 7,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 7,
    backgroundColor: GRAY_50,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  thText: { color: WHITE, fontSize: 7, fontFamily: 'Helvetica-Bold' },
  tdText: { fontFamily: 'Helvetica', color: GRAY_700, fontSize: 7.5 },
  tdBold: { fontFamily: 'Helvetica-Bold', color: GRAY_900, fontSize: 7.5 },
  tdGreen: { fontFamily: 'Helvetica-Bold', color: GREEN, fontSize: 7.5 },
  tdTamil: {
    fontFamily: 'NotoSansTamil',
    fontWeight: 'bold',
    color: GRAY_900,
    fontSize: 7.5,
  },
  tdTamilSub: {
    fontFamily: 'NotoSansTamil',
    fontWeight: 'normal',
    color: GRAY_500,
    fontSize: 6.5,
    marginTop: 1,
  },
  // ── Column widths ──
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  colProfit: { flex: 1.5, textAlign: 'right' },
  colPerPlate: { flex: 1.5, textAlign: 'right' },
  colRawCost: { flex: 1.5, textAlign: 'right' },
  // ── Order banner ──
  orderBanner: {
    backgroundColor: INDIGO_LIGHT,
    borderRadius: 5,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: INDIGO,
  },
  orderBannerTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: INDIGO_DARK,
  },
  orderBannerSub: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    marginTop: 2,
  },
  badge: {
    backgroundColor: INDIGO,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  badgeText: { color: WHITE, fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
  // ── Empty / thank-you / footer ──
  emptyRow: { padding: 10, alignItems: 'center' },
  emptyText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: GRAY_500,
    fontStyle: 'italic',
  },
  thankyou: {
    marginTop: 16,
    padding: 12,
    backgroundColor: INDIGO_LIGHT,
    borderRadius: 5,
    alignItems: 'center',
  },
  thankyouText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: INDIGO,
    marginBottom: 2,
  },
  thankyouSub: { fontSize: 7, fontFamily: 'Helvetica', color: GRAY_500 },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 6,
  },
  footerText: { fontSize: 6.5, fontFamily: 'Helvetica', color: GRAY_500 },
})

// ─── PDF: Summary Page ────────────────────────────────────────────────────────

const SummaryPage: FC<{
  data: ReportData
  timestamp: string
  message: string
}> = ({ data, timestamp, message }) => (
  <Page size="A5" style={pdf.page}>
    <View style={pdf.header}>
      <View>
        <View style={pdf.logoSection}>
          <Image
            src="/Images/logo.jpg"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        </View>
        <Text style={pdf.companyName}>Venkateswara Mess & Catering</Text>
        <Text style={pdf.companyTag}>Financial Report</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={pdf.reportTitle}>REPORT</Text>
        <Text style={pdf.reportSub}>{message}</Text>
        <Text style={pdf.reportDate}>Generated: {fmtTimestamp(timestamp)}</Text>
      </View>
    </View>

    <Text style={pdf.sectionTitle}>Global Summary</Text>
    <View style={pdf.summaryRow}>
      <View style={pdf.card}>
        <Text style={pdf.cardLabel}>Total Income</Text>
        <Text style={pdf.cardValue}>{fmt(data.totalGlobalIncome)}</Text>
      </View>
      <View style={pdf.card}>
        <Text style={pdf.cardLabel}>Misc Expenses</Text>
        <Text
          style={
            data.totalGlobalMiscExpense > 0 ? pdf.cardValueRed : pdf.cardValue
          }
        >
          {fmt(data.totalGlobalMiscExpense)}
        </Text>
      </View>
      <View style={pdf.cardAccent}>
        <Text style={pdf.cardLabelLight}>Net Profit</Text>
        <Text style={pdf.cardValueLight}>{fmt(data.totalGlobalNetProfit)}</Text>
      </View>
      <View style={pdf.card}>
        <Text style={pdf.cardLabel}>People Served</Text>
        <Text style={pdf.cardValue}>{data.totalGlobalPeopleServed}</Text>
      </View>
    </View>

    <Text style={pdf.sectionTitle}>Orders Overview</Text>
    <View style={pdf.tableHeader}>
      <Text style={[pdf.thText, { flex: 0.5 }]}>#</Text>
      <Text style={[pdf.thText, { flex: 2 }]}>Customer</Text>
      <Text style={[pdf.thText, { flex: 1.5 }]}>Event Date</Text>
      <Text style={[pdf.thText, { flex: 0.8, textAlign: 'right' }]}>Pax</Text>
      <Text style={[pdf.thText, { flex: 1.5, textAlign: 'right' }]}>
        Income
      </Text>
      <Text style={[pdf.thText, { flex: 1.5, textAlign: 'right' }]}>
        Profit
      </Text>
    </View>
    {data.orderDetails.map((o, i) => (
      <View
        key={o.orderId}
        style={i % 2 === 0 ? pdf.tableRow : pdf.tableRowAlt}
      >
        <Text style={[pdf.tdText, { flex: 0.5 }]}>{o.orderId}</Text>
        <Text style={[pdf.tdBold, { flex: 2 }]}>{o.customerName}</Text>
        <Text style={[pdf.tdText, { flex: 1.5 }]}>{fmtDate(o.eventDate)}</Text>
        <Text style={[pdf.tdText, { flex: 0.8, textAlign: 'right' }]}>
          {o.totalPeople}
        </Text>
        <Text style={[pdf.tdText, { flex: 1.5, textAlign: 'right' }]}>
          {fmt(o.orderIncome)}
        </Text>
        <Text style={[pdf.tdGreen, { flex: 1.5, textAlign: 'right' }]}>
          {fmt(o.orderProfit)}
        </Text>
      </View>
    ))}

    <View style={pdf.thankyou}>
      <Text style={pdf.thankyouText}>Thank you for your Business</Text>
      <Text style={pdf.thankyouSub}>
        Detailed order breakdown on the following pages
      </Text>
    </View>

    <View style={pdf.footer}>
      <Text style={pdf.footerText}>Confidential Financial Report</Text>
      <Text style={pdf.footerText}>
        Page 1 of {data.orderDetails.length + 1}
      </Text>
    </View>
  </Page>
)

// ─── PDF: Menu Items Table ────────────────────────────────────────────────────

const MenuItemsTable: FC<{ items: MenuItem[]; title: string }> = ({
  items,
  title,
}) => (
  <View style={{ marginBottom: 10 }}>
    <Text
      style={{
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: GRAY_700,
        marginBottom: 5,
      }}
    >
      {title}
    </Text>
    <View style={pdf.tableHeader}>
      <Text style={[pdf.thText, pdf.colProduct]}>Product</Text>
      <Text style={[pdf.thText, pdf.colQty]}>Qty</Text>
      <Text style={[pdf.thText, pdf.colUnit]}>Unit</Text>
      <Text style={[pdf.thText, pdf.colPerPlate]}>Plate</Text>
      <Text style={[pdf.thText, pdf.colRawCost]}>Raw</Text>
      <Text style={[pdf.thText, pdf.colTotal]}>Total</Text>
      <Text style={[pdf.thText, pdf.colProfit]}>Profit</Text>
    </View>
    {items.length === 0 ? (
      <View style={pdf.emptyRow}>
        <Text style={pdf.emptyText}>No items</Text>
      </View>
    ) : (
      items.map((item, i) => (
        <View key={i} style={i % 2 === 0 ? pdf.tableRow : pdf.tableRowAlt}>
          <View style={pdf.colProduct}>
            <Text style={pdf.tdTamil}>{item.productName}</Text>
            {item.productSecondaryName && (
              <Text style={pdf.tdTamilSub}>{item.productSecondaryName}</Text>
            )}
          </View>
          <Text style={[pdf.tdText, pdf.colQty]}>{item.quantity}</Text>
          <Text style={[pdf.tdText, pdf.colUnit]}>
            {fmt(item.productUnitPrice)}
          </Text>
          <Text style={[pdf.tdText, pdf.colPerPlate]}>
            {fmt(item.perPlate)}
          </Text>
          <Text style={[pdf.tdText, pdf.colRawCost]}>
            {fmt(item.productRawMaterialCost)}
          </Text>
          <Text style={[pdf.tdBold, pdf.colTotal]}>
            {fmt(item.productLineTotal)}
          </Text>
          <Text style={[pdf.tdGreen, pdf.colProfit]}>
            {fmt(item.productProfit)}
          </Text>
        </View>
      ))
    )}
  </View>
)

// ─── PDF: Order Page ──────────────────────────────────────────────────────────

const OrderPage: FC<{
  order: OrderDetail
  pageNum: number
  totalPages: number
}> = ({ order, pageNum, totalPages }) => (
  <Page size="A5" style={pdf.page}>
    <View style={pdf.header}>
      <View>
        <View style={pdf.logoSection}>
          <Image
            src="/Images/logo.jpg"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        </View>
        <Text style={pdf.companyName}>Venkateswara Mess & Catering</Text>
        <Text style={pdf.companyTag}>Financial Report</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={pdf.reportTitle}>ORDER</Text>
        <Text style={pdf.reportSub}>#{order.orderId} — Detailed Breakdown</Text>
        <Text style={pdf.reportDate}>{fmtDate(order.eventDate)}</Text>
      </View>
    </View>

    <View style={pdf.orderBanner}>
      <View>
        <Text style={pdf.orderBannerTitle}>{order.customerName}</Text>
        <Text style={pdf.orderBannerSub}>
          Event Date: {fmtDate(order.eventDate)}
        </Text>
        <Text style={pdf.orderBannerSub}>
          People Served: {order.totalPeople}
        </Text>
        {order.rawMaterialUsage && (
          <Text style={pdf.orderBannerSub}>
            Raw Materials: {order.rawMaterialUsage}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={pdf.badge}>
          <Text style={pdf.badgeText}>ORDER #{order.orderId}</Text>
        </View>
        <Text style={[pdf.orderBannerSub, { color: GREEN, fontWeight: '700' }]}>
          Income: {fmt(order.orderIncome)}
        </Text>
      </View>
    </View>

    <MenuItemsTable items={order.menuItems} title="Menu Items (Per Plate)" />

    {order.additionalMenuItems?.length > 0 && (
      <MenuItemsTable
        items={order.additionalMenuItems}
        title="Additional Menu Items"
      />
    )}

    {order.additionalItems?.length > 0 && (
      <View style={{ marginBottom: 10 }}>
        <Text
          style={{
            fontSize: 8,
            fontFamily: 'Helvetica-Bold',
            color: GRAY_700,
            marginBottom: 5,
          }}
        >
          Additional Items
        </Text>
        <View style={pdf.tableHeader}>
          <Text style={[pdf.thText, { flex: 3 }]}>Item</Text>
          <Text style={[pdf.thText, { flex: 1, textAlign: 'right' }]}>
            Amount
          </Text>
        </View>
        {order.additionalItems.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? pdf.tableRow : pdf.tableRowAlt}>
            <Text style={[pdf.tdTamil, { flex: 3 }]}>
              {item.name ?? item.productName ?? 'Item'}
            </Text>
            <Text style={[pdf.tdBold, { flex: 1, textAlign: 'right' }]}>
              {fmt(item.amount ?? item.productLineTotal ?? 0)}
            </Text>
          </View>
        ))}
      </View>
    )}

    <View style={pdf.footer}>
      <Text style={pdf.footerText}>Confidential Financial Report</Text>
      <Text style={pdf.footerText}>
        Page {pageNum} of {totalPages}
      </Text>
    </View>
  </Page>
)

// ─── PDF: Document ────────────────────────────────────────────────────────────

const ReportDocument: FC<{ reportData: ReportResponse }> = ({ reportData }) => {
  const { data, timestamp, message } = reportData
  const totalPages = data.orderDetails.length + 1
  return (
    <Document>
      <SummaryPage data={data} timestamp={timestamp} message={message} />
      {data.orderDetails.map((order, i) => (
        <OrderPage
          key={order.orderId}
          order={order}
          pageNum={i + 2}
          totalPages={totalPages}
        />
      ))}
    </Document>
  )
}

// ─── Preview Styles (shared) ──────────────────────────────────────────────────

const pageShell = (isMobile: boolean): React.CSSProperties => ({
  width: '100%',
  ...(isMobile ? {} : { maxWidth: 600, margin: '0 auto' }),
  backgroundColor: WHITE,
  padding: isMobile ? '20px 14px' : '32px 28px',
  boxSizing: 'border-box',
  fontFamily: PREVIEW_FONT,
  borderRadius: 10,
  boxShadow: '0 4px 28px rgba(0,0,0,0.10)',
  marginBottom: 24,
})

// ─── Preview: StatCard ────────────────────────────────────────────────────────

const StatCard: FC<{
  label: string
  value: string | number
  accent?: boolean
  green?: boolean
  red?: boolean
}> = ({ label, value, accent = false, green = false, red = false }) => (
  <div
    style={{
      flex: 1,
      minWidth: 100,
      borderRadius: 8,
      padding: '13px 14px',
      backgroundColor: accent ? INDIGO : GRAY_50,
      border: accent ? 'none' : `1px solid ${GRAY_200}`,
    }}
  >
    <p
      style={{
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: accent ? '#A5B4FC' : GRAY_500,
        fontWeight: 600,
        margin: '0 0 5px 0',
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: accent ? WHITE : green ? GREEN : red ? RED : GRAY_900,
        margin: 0,
        lineHeight: 1.2,
      }}
    >
      {value}
    </p>
  </div>
)

// ─── Preview: Page Header ─────────────────────────────────────────────────────

const PreviewHeader: FC<{ right: React.ReactNode }> = ({ right }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingBottom: 18,
      borderBottom: `2px solid ${INDIGO}`,
      marginBottom: 22,
    }}
  >
    <div>
      <img
        src="/Images/logo.jpg"
        style={{ width: 36, height: 36, objectFit: 'contain' }}
      />

      <p
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: GRAY_900,
          margin: '0 0 2px 0',
        }}
      >
        Venkateswara Mess & Catering
      </p>
      <p style={{ fontSize: 9, color: GRAY_500, margin: 0 }}>
        Financial Report
      </p>
    </div>
    {right}
  </div>
)

// ─── Preview: Table wrapper ───────────────────────────────────────────────────

const ScrollTable: FC<{ children: React.ReactNode; minW?: number }> = ({
  children,
  minW = 520,
}) => (
  <div style={{ overflowX: 'auto' }}>
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 11,
        minWidth: minW,
      }}
    >
      {children}
    </table>
  </div>
)

const Th: FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({
  children,
  align = 'left',
}) => (
  <th
    style={{
      padding: '8px 10px',
      fontWeight: 700,
      textAlign: align,
      fontSize: 10,
      color: WHITE,
      backgroundColor: INDIGO,
    }}
  >
    {children}
  </th>
)

const Td: FC<{
  children: React.ReactNode
  align?: 'left' | 'right'
  bold?: boolean
  green?: boolean
  tamil?: boolean
}> = ({
  children,
  align = 'left',
  bold = false,
  green = false,
  tamil = false,
}) => (
  <td
    style={{
      padding: '8px 10px',
      textAlign: align,
      fontSize: 11,
      fontWeight: bold ? 700 : 400,
      color: green ? GREEN : bold ? GRAY_900 : GRAY_700,
      fontFamily: tamil ? PREVIEW_FONT : 'inherit',
    }}
  >
    {children}
  </td>
)

// ─── Preview: Menu Table ──────────────────────────────────────────────────────

const PreviewMenuTable: FC<{ items: MenuItem[]; title: string }> = ({
  items,
  title,
}) => (
  <div style={{ marginBottom: 18 }}>
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: GRAY_700,
        margin: '0 0 8px 0',
      }}
    >
      {title}
    </p>
    <ScrollTable minW={520}>
      <thead>
        <tr>
          <Th>Product</Th>
          <Th align="right">Qty</Th>
          <Th align="right">Unit Price</Th>
          <Th align="right">Per Plate</Th>
          <Th align="right">Raw Cost</Th>
          <Th align="right">Line Total</Th>
          <Th align="right">Profit</Th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              style={{
                padding: 14,
                textAlign: 'center',
                color: GRAY_500,
                fontSize: 10,
                fontStyle: 'italic',
              }}
            >
              No items
            </td>
          </tr>
        ) : (
          items.map((item, i) => (
            <tr
              key={i}
              style={{ backgroundColor: i % 2 === 0 ? WHITE : GRAY_50 }}
            >
              <td style={{ padding: '8px 10px', fontSize: 11 }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: GRAY_900,
                    fontFamily: PREVIEW_FONT,
                  }}
                >
                  {item.productName}
                </span>
                {item.productSecondaryName && (
                  <span
                    style={{
                      display: 'block',
                      fontWeight: 400,
                      color: GRAY_500,
                      fontSize: 9.5,
                      fontFamily: PREVIEW_FONT,
                    }}
                  >
                    {item.productSecondaryName}
                  </span>
                )}
              </td>
              <Td align="right">{item.quantity}</Td>
              <Td align="right">{fmt(item.productUnitPrice)}</Td>
              <Td align="right">{fmt(item.perPlate)}</Td>
              <Td align="right">{fmt(item.productRawMaterialCost)}</Td>
              <Td align="right" bold>
                {fmt(item.productLineTotal)}
              </Td>
              <Td align="right" bold green>
                {fmt(item.productProfit)}
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </ScrollTable>
  </div>
)

// ─── Preview: Summary Page ────────────────────────────────────────────────────

const PreviewSummaryPage: FC<{
  data: ReportData
  timestamp: string
  message: string
  isMobile: boolean
}> = ({ data, timestamp, message, isMobile }) => (
  <div style={pageShell(isMobile)}>
    <PreviewHeader
      right={
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: INDIGO,
              margin: '0 0 4px 0',
              letterSpacing: 2,
            }}
          >
            REPORT
          </p>
          <p style={{ fontSize: 10, color: GRAY_500, margin: '0 0 2px 0' }}>
            {message}
          </p>
          <p style={{ fontSize: 10, color: GRAY_700, margin: 0 }}>
            Generated: {fmtTimestamp(timestamp)}
          </p>
        </div>
      }
    />

    <p
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: INDIGO_DARK,
        margin: '0 0 12px 0',
      }}
    >
      Global Summary
    </p>
    <div
      style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}
    >
      <StatCard label="Total Income" value={fmt(data.totalGlobalIncome)} />
      <StatCard
        label="Misc Expenses"
        value={fmt(data.totalGlobalMiscExpense)}
        red={data.totalGlobalMiscExpense > 0}
      />
      <StatCard
        label="Net Profit"
        value={fmt(data.totalGlobalNetProfit)}
        accent
      />
      <StatCard label="People Served" value={data.totalGlobalPeopleServed} />
    </div>

    <p
      style={{
        fontSize: 13,
        fontWeight: 800,
        color: INDIGO_DARK,
        margin: '0 0 10px 0',
      }}
    >
      Orders Overview
    </p>
    <ScrollTable minW={460}>
      <thead>
        <tr>
          <Th>#</Th>
          <Th>Customer</Th>
          <Th>Event Date</Th>
          <Th align="right">Pax</Th>
          <Th align="right">Income</Th>
          <Th align="right">Profit</Th>
        </tr>
      </thead>
      <tbody>
        {data.orderDetails.map((o, i) => (
          <tr
            key={o.orderId}
            style={{ backgroundColor: i % 2 === 0 ? WHITE : GRAY_50 }}
          >
            <Td>{o.orderId}</Td>
            <Td bold>{o.customerName}</Td>
            <Td>{fmtDate(o.eventDate)}</Td>
            <Td align="right">{o.totalPeople}</Td>
            <Td align="right">{fmt(o.orderIncome)}</Td>
            <Td align="right" bold green>
              {fmt(o.orderProfit)}
            </Td>
          </tr>
        ))}
      </tbody>
    </ScrollTable>

    <div
      style={{
        marginTop: 24,
        backgroundColor: INDIGO_LIGHT,
        borderRadius: 8,
        padding: '14px 18px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: INDIGO,
          margin: '0 0 3px 0',
        }}
      >
        Thank you for your Business
      </p>
      <p style={{ fontSize: 10, color: GRAY_500, margin: 0 }}>
        Detailed order breakdown on the following pages
      </p>
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: `1px solid ${GRAY_200}`,
        paddingTop: 8,
        marginTop: 16,
      }}
    >
      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0 }}>
        Confidential Financial Report
      </p>
      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0 }}>
        Page 1 of {data.orderDetails.length + 1}
      </p>
    </div>
  </div>
)

// ─── Preview: Order Page ──────────────────────────────────────────────────────

const PreviewOrderPage: FC<{
  order: OrderDetail
  pageNum: number
  totalPages: number
  isMobile: boolean
}> = ({ order, pageNum, totalPages, isMobile }) => (
  <div style={pageShell(isMobile)}>
    <PreviewHeader
      right={
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: INDIGO,
              margin: '0 0 4px 0',
              letterSpacing: 2,
            }}
          >
            ORDER
          </p>
          <p style={{ fontSize: 10, color: GRAY_500, margin: '0 0 2px 0' }}>
            #{order.orderId} — Detailed Breakdown
          </p>
          <p style={{ fontSize: 10, color: GRAY_700, margin: 0 }}>
            {fmtDate(order.eventDate)}
          </p>
        </div>
      }
    />

    <div
      style={{
        backgroundColor: INDIGO_LIGHT,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: `3px solid ${INDIGO}`,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: INDIGO_DARK,
            margin: '0 0 3px 0',
          }}
        >
          {order.customerName}
        </p>
        <p style={{ fontSize: 10, color: GRAY_500, margin: '0 0 2px 0' }}>
          Event Date: {fmtDate(order.eventDate)}
        </p>
        <p style={{ fontSize: 10, color: GRAY_500, margin: 0 }}>
          People Served: {order.totalPeople}
        </p>
        {order.rawMaterialUsage && (
          <p style={{ fontSize: 10, color: GRAY_500, margin: '2px 0 0 0' }}>
            Raw Materials: {order.rawMaterialUsage}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-block',
            backgroundColor: INDIGO,
            color: WHITE,
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 9,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          ORDER #{order.orderId}
        </span>
        <p style={{ fontSize: 10, color: GREEN, fontWeight: 700, margin: 0 }}>
          Income: {fmt(order.orderIncome)}
        </p>
      </div>
    </div>

    <PreviewMenuTable items={order.menuItems} title="Menu Items (Per Plate)" />

    {order.additionalMenuItems?.length > 0 && (
      <PreviewMenuTable
        items={order.additionalMenuItems}
        title="Additional Menu Items"
      />
    )}

    {order.additionalItems?.length > 0 && (
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: GRAY_700,
            margin: '0 0 8px 0',
          }}
        >
          Additional Items
        </p>
        <ScrollTable minW={280}>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {order.additionalItems.map((item, i) => (
              <tr
                key={i}
                style={{ backgroundColor: i % 2 === 0 ? WHITE : GRAY_50 }}
              >
                <Td tamil>{item.name ?? item.productName ?? 'Item'}</Td>
                <Td align="right" bold>
                  {fmt(item.amount ?? item.productLineTotal ?? 0)}
                </Td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    )}

    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: `1px solid ${GRAY_200}`,
        paddingTop: 8,
        marginTop: 16,
      }}
    >
      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0 }}>
        Confidential Financial Report
      </p>
      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0 }}>
        Page {pageNum} of {totalPages}
      </p>
    </div>
  </div>
)

// ─── Download Button ──────────────────────────────────────────────────────────

const DownloadButton: FC<{ reportData: ReportResponse }> = ({ reportData }) => {
  const [ready, setReady] = useState(false)
  const isMobile = useWindowWidth() < 768

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  const btnStyle = (loading = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: WHITE,
    border: 'none',
    borderRadius: 50,
    padding: isMobile ? '11px 16px' : '13px 22px',
    fontSize: isMobile ? 12 : 13,
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer',
    backgroundColor: loading ? '#6366F1' : INDIGO,
    boxShadow: '0 8px 24px rgba(67,56,202,0.35)',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  })

  const DownloadIcon = () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
  )

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isMobile ? 24 : 32,
        right: isMobile ? 16 : 32,
        zIndex: 50,
      }}
    >
      {!ready ? (
        <button
          disabled
          style={{ ...btnStyle(), opacity: 0.7, cursor: 'not-allowed' }}
        >
          <DownloadCloudIcon /> Preparing PDF…
        </button>
      ) : (
        <PDFDownloadLink
          document={<ReportDocument reportData={reportData} />}
          fileName={`financial-report-${new Date().toISOString().slice(0, 10)}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <button
              style={btnStyle(loading)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow =
                  '0 12px 32px rgba(67,56,202,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(67,56,202,0.35)'
              }}
            >
              <DownloadIcon />
              {loading ? 'Generating…' : 'Download A5 PDF'}
            </button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinancialReport({
  reportData,
}: {
  reportData: ReportResponse
}) {
  const { data, timestamp, message } = reportData
  const totalPages = data.orderDetails.length + 1
  const isMobile = useWindowWidth() < 768

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: INDIGO_LIGHT,
        padding: isMobile ? '20px 10px' : '36px 20px',
        fontFamily: PREVIEW_FONT,
      }}
    >
      {/* Page header bar */}
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 8 : 0,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: isMobile ? 16 : 20,
              fontWeight: 800,
              color: GRAY_900,
              margin: '0 0 2px 0',
            }}
          >
            Financial Report
          </h1>
          <p style={{ fontSize: 11, color: GRAY_500, margin: 0 }}>
            {message} · {fmtTimestamp(timestamp)}
          </p>
        </div>
        <span
          style={{
            backgroundColor: INDIGO,
            color: WHITE,
            borderRadius: 20,
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {totalPages} pages · A5
        </span>
      </div>

      {/* Pages */}
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <PreviewSummaryPage
          data={data}
          timestamp={timestamp}
          message={message}
          isMobile={isMobile}
        />
        {data.orderDetails.map((order, i) => (
          <PreviewOrderPage
            key={order.orderId}
            order={order}
            pageNum={i + 2}
            totalPages={totalPages}
            isMobile={isMobile}
          />
        ))}
      </div>

      <DownloadButton reportData={reportData} />
    </div>
  )
}
