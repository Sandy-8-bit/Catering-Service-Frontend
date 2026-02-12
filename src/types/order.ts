export interface OrderDriver {
  driverId: number
  driverName: string
  driverNumber: string
}

export interface OrderProductRef {
  productId: number
  productPrimaryName: string
  productSecondaryName: string
  primaryName?: string
  secondaryName?: string
}

export interface OrderAdditionalItemRef {
  additionalItemId: number
  additionalItemPrimaryName: string
  additionalItemSecondaryName: string
}

export interface OrderItem {
  id: number
  product: OrderProductRef
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderAdditionalItem {
  id: number
  additionalItem: OrderAdditionalItemRef
  quantity: number
  priceAtOrder: number
  lineTotal: number
  
}

// Full order shape returned by GET endpoints (list/detail)
export interface Order {
  id: number
  customerName: string
  customerPhone: string
  customerAddress: string
  eventType: string
  eventDate: string
  eventTime: string
  totalPeople: number
  deliveredByUs: boolean
  driver?: OrderDriver
  totalAmount?: number
  advanceAmount: number
  paymentType: string
  status?: string
  items: OrderItem[]
  additionalItems: OrderAdditionalItem[]
  createdAt: string
  updatedAt: string
  locationUrl:string
}

// Payload fragment for POST / PATCH item entries
export interface OrderItemPayload {
  id?: number | null
  productId: number
  quantity: number
}

// Payload fragment for POST / PATCH additional items
export interface OrderAdditionalItemPayload {
  id?: number | null
 
  quantity: number
  returned?: boolean
}

// Body for POST /api/admin/orders
export interface OrderPayload {
  customerName: string
  customerPhone: string
  customerAddress: string
  eventType: string
  eventDate: string
  eventTime: string
  totalPeople: number
  totalAmount?: number
  status?: string
  returnableItemsChecked?: boolean
  deliveredByUs: boolean
  driverId?: number
  advanceAmount: number
  paymentType: string
  items: OrderItemPayload[]
  additionalItems?: OrderAdditionalItemPayload[]
}

// Body for PATCH /api/admin/orders/{orderId}
export type OrderUpdatePayload = {
  id: number
} & Partial<OrderPayload>
