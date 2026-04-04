import type { Order, OrderPayload, OrderUpdatePayload } from '@/types/order'

/**
 * Maps Order form state to API POST payload
 * Keeps exact structure as specified in requirements
 */
export const mapOrderToPayload = (order: Order): OrderPayload => {
  return {
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    customerAddress: order.customerAddress || '',
    eventType: order.eventType || '',
    eventDate: order.eventDate || '',
    eventTime: order.eventTime || '',
    locationUrl: order.locationUrl || '',
    totalPlates: order.totalPlates || 1,
    priceReducedPerPlate: order.priceReducedPerPlate || 0,
    deliveredByUs: order.deliveredByUs || false,
    driverId: order.driver?.driverId || undefined,
    deliveryCharge: order.deliveredByUs ? order.deliveryCharge || 0 : 0,
    discountAmount: order.discountAmount || 0,
    discountPercentage: order.discountPercentage || 0,
    advanceAmount: order.advanceAmount || 0,
    paymentType: order.paymentType || 'CASH',
    // Send all items with proper structure
    items: (order.items || []).map((item) => ({
      productId: item.product?.productId || 0,
      quantity: item.quantity || 1,
    })),
    // Additional menu items (complementary products)
    additionalMenuItems: (order.additionalMenuItems || []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity || 1,
    })),
    // Additional items (extras like delivery boxes, decorations, etc)
    additionalItems: (order.additionalItems || []).map((item) => ({
      additionalItemId: item.additionalItemId,
      quantity: item.quantity || 1,
    })),
  }
}

/**
 * Maps Order form state to API PATCH payload
 * Keeps exact structure, sends all fields and complete lists
 */
export const mapOrderToUpdatePayload = (
  order: Order,
  existingOrder?: Order
): OrderUpdatePayload => {
  return {
    id: order.id || 0,
    customerName: order.customerName || existingOrder?.customerName || '',
    customerPhone: order.customerPhone || existingOrder?.customerPhone || '',
    customerAddress:
      order.customerAddress || existingOrder?.customerAddress || '',
    eventType: order.eventType || existingOrder?.eventType || '',
    eventDate: order.eventDate || existingOrder?.eventDate || '',
    eventTime: order.eventTime || existingOrder?.eventTime || '',
    locationUrl: order.locationUrl || existingOrder?.locationUrl || '',
    totalPlates: order.totalPlates || existingOrder?.totalPlates || 1,
    priceReducedPerPlate:
      order.priceReducedPerPlate ?? existingOrder?.priceReducedPerPlate ?? 0,
    deliveredByUs:
      order.deliveredByUs !== undefined
        ? order.deliveredByUs
        : existingOrder?.deliveredByUs || false,
    driverId:
      (order.deliveredByUs || existingOrder?.deliveredByUs) &&
      (order.driver || existingOrder?.driver)
        ? order.driver?.driverId || existingOrder?.driver?.driverId || undefined
        : undefined,
    deliveryCharge:
      order.deliveredByUs || existingOrder?.deliveredByUs
        ? (order.deliveryCharge ?? existingOrder?.deliveryCharge ?? 0)
        : 0,
    discountAmount: order.discountAmount ?? existingOrder?.discountAmount ?? 0,
    discountPercentage:
      order.discountPercentage ?? existingOrder?.discountPercentage ?? 0,
    advanceAmount: order.advanceAmount ?? existingOrder?.advanceAmount ?? 0,
    paymentType: order.paymentType || existingOrder?.paymentType || 'CASH',
    // CRITICAL: Send COMPLETE lists, not partial
    items: (order.items || existingOrder?.items || []).map((item) => ({
      productId: item.product?.productId || 0,
      quantity: item.quantity || 1,
    })),
    additionalMenuItems: (
      order.additionalMenuItems ||
      existingOrder?.additionalMenuItems ||
      []
    ).map((item) => ({
      productId: item.productId,
      quantity: item.quantity || 1,
    })),
    additionalItems: (
      order.additionalItems ||
      existingOrder?.additionalItems ||
      []
    ).map((item) => ({
      additionalItemId: item.additionalItemId,
      quantity: item.quantity || 1,
    })),
  }
}
