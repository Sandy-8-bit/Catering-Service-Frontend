import type {
  Order,
  OrderAdditionalItemPayload,
  OrderItemPayload,
  OrderPayload,
  OrderUpdatePayload,
} from '@/types/Order'

export const mapOrderToPayload = (order: Order): OrderPayload => {
  const driverId = (order as Partial<{ driverId?: number }>).driverId
  const payload: OrderPayload = {
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    eventType: order.eventType,
    eventDate: order.eventDate,
    eventTime: order.eventTime,
    totalPeople: order.totalPeople,
    totalAmount: order.totalAmount,
    balanceAmount: order.balanceAmount,
    status: order.status,
    returnableItemsChecked: order.returnableItemsChecked,
    deliveredByUs: order.deliveredByUs,
    driverId: driverId ?? order.driver?.driverId,
    advanceAmount: order.advanceAmount,
    paymentType: order.paymentType,
    items: toOrderItemPayload(order.items),
  }

  const additionalItems = toAdditionalItemPayload(order.additionalItems)
  if (additionalItems.length) {
    payload.additionalItems = additionalItems
  }

  return payload
}

export const mapOrderToUpdatePayload = (order: Order): OrderUpdatePayload => {
  const basePayload = mapOrderToPayload(order)
  const items = toOrderItemPayload(order.items, true)
  const additionalItems = toAdditionalItemPayload(order.additionalItems, true)

  return {
    id: order.id,
    ...basePayload,
    items,
    ...(additionalItems.length ? { additionalItems } : {}),
  }
}

export const toOrderItemPayload = (
  items?: Order['items'],
  includeIds = false
): OrderItemPayload[] =>
  items?.map((item) => ({
    ...(includeIds && item.id > 0 ? { id: item.id } : {}),
    productId: item.product.productId,
    quantity: item.quantity,
  })) ?? []

export const toAdditionalItemPayload = (
  items?: Order['additionalItems'],
  includeIds = false
): OrderAdditionalItemPayload[] =>
  items?.map((item) => ({
    ...(includeIds && item.id > 0 ? { id: item.id } : {}),
    additionalItemId: item.additionalItem.additionalItemId,
    quantity: item.quantity,
    returned: item.returned,
  })) ?? []
