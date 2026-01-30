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
   Driver Dashboard
========================= */
export interface DriverDashboard {
  driverId: number
  assignedOrders: AssignedOrder[]
  returnableItems: ReturnableItem[]
  returnPickupDate: string
}

/* =========================
   Assigned Orders
========================= */
export interface AssignedOrder {
  orderId: number
  customerName: string
  customerPhone: string
  customerAddress: string
  locationUrl: string
  eventType: string
  eventDate: string // YYYY-MM-DD
  eventTime: string
  totalPeople: number
  totalAmount: number
  advanceAmount: number
  balanceAmount: number
}

/* =========================
   Returnable Items
========================= */
export interface ReturnableItem {
  deliveryId: number
  orderId: number
  status: string
  vessels: Vessel[]
  amountReceived: number
  paymentMode: string
  amountNote: string
  vesselName: string
  quantityGiven: number
  quantityReturned: number
  pendingReturn: number
  returnPickupDate: string // ISO string
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
   Final API Response Type
========================= */
export type DriverDashboardResponse = ApiResponse<DriverDashboard>
