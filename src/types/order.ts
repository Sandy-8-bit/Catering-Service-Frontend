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
  productPrimaryName: string
  productSecondaryName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderAdditionalItem {
  id: number
  additionalItemId: number
  itemPrimaryName: string
  itemSecondaryName: string
  quantity: number
  priceAtOrder: number
  lineTotal: number
  returned?: boolean
}

export interface RequiredSubProduct {
  subProductName: string
  requiredQuantity: number
  unit: string
}

// Payload fragment for POST / PATCH additional menu items
export interface OrderAdditionalMenuItem {
  productId: number
  quantity: number
  productPrimaryName?: string
  productSecondaryName?: string
  unitPrice?: number
  totalPrice?: number
}

// Full order shape returned by GET endpoints (list/detail)
export interface Order {
  id: number
  audioId?: number | null
  customerName: string
  customerPhone: string | null
  customerAddress: string | null
  eventType: string | null
  eventDate: string
  eventTime: string | null
  totalPlates: number | null
  deliveredByUs: boolean
  driver?: OrderDriver
  driverId?: number | null
  driverName?: string | null
  offerPercentage?: number
  totalAmount?: number
  advanceAmount: number
  priceReducedPerPlate?: number | null
  discountPercentage?: number | null
  balanceAmount: number
  paymentType: string | null
  orderStatus?: string
  paymentStatus?: string
  status?: string
  items: OrderItem[]
  additionalItems: OrderAdditionalItem[]
  additionalMenuItems?: OrderAdditionalMenuItem[]
  requiredSubProducts?: RequiredSubProduct[]
  discountAmount?: number
  createdAt?: string
  updatedAt?: string
  locationUrl: string | null
  deliveryCharge?: number | null
  subTotalAmount?: number
  grandTotalAmount?: number
  returnableItemsChecked?: boolean
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
  additionalItemId: number
  quantity: number
  returned?: boolean
}

// Payload fragment for POST / PATCH additional menu items
export interface OrderAdditionalMenuItemPayload {
  productId: number
  quantity: number
}

// Body for POST /api/admin/orders
export interface OrderPayload {
  customerName: string
  customerPhone: string
  customerAddress: string
  eventType: string
  eventDate: string
  eventTime: string
  totalPlates: number
  offerPercentage?: number
  priceReducedPerPlate?: number
  discountAmount?: number
  discountPercentage?: number
  totalAmount?: number
  status?: string
  returnableItemsChecked?: boolean
  deliveredByUs: boolean
  driverId?: number
  advanceAmount: number
  paymentType: string
  locationUrl?: string
  deliveryCharge?: number
  items: OrderItemPayload[]
  additionalItems?: OrderAdditionalItemPayload[]
  additionalMenuItems?: OrderAdditionalMenuItemPayload[]
}

// Body for PATCH /api/admin/orders/{orderId}
export type OrderUpdatePayload = {
  id: number
} & Partial<OrderPayload>
