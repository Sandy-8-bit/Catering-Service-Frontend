/* =========================
   Generic API Response
========================= */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode?: string
  timestamp: string
  path: string
}

/* =========================
   Event Time (Backend format)
========================= */
export interface EventTime {
  hour: number
  minute: number
  second: number
  nano: number
}

/* =========================
   Vessel
========================= */
export interface Vessel {
  id: number
  name: string
  quantityGiven: number
  quantityReturned: number
}

/* =========================
   Driver Order Detail
========================= */
export interface DriverOrderDetail {
  id: number
  driverId: number
  driverName: string

  orderId: number
  customerName: string
  customerPhone: string
  customerAddress: string
  locationUrl: string

  eventType: string
  eventDate: string // YYYY-MM-DD
  eventTime: EventTime

  totalPeople: number
  orderTotalAmount: number
  orderAdvanceAmount: number
  orderBalanceAmount: number

  vessels: Vessel[]

  status: string
  amountReceived: number
  paymentMode: string
  amountNote: string

  createdAt: string // ISO
  updatedAt: string // ISO
}

/* =========================
   Final API Response Type
========================= */
export type DriverOrdersResponse = ApiResponse<DriverOrderDetail[]>
