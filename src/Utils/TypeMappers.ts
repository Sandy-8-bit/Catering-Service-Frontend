import isEqual from 'lodash/isEqual'

import type {
  Order,
  OrderAdditionalItemPayload,
  OrderItemPayload,
  OrderPayload,
  OrderUpdatePayload,
} from '@/types/order'

const ORDER_UPDATE_DIFF_FIELDS: ReadonlyArray<keyof OrderPayload> = [
  'customerName',
  'customerPhone',
  'customerAddress',
  'eventType',
  'eventDate',
  'eventTime',
  'totalPeople',
  'totalAmount',
  'balanceAmount',
  'status',
  'returnableItemsChecked',
  'deliveredByUs',
  'driverId',
  'advanceAmount',
  'paymentType',
]

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

export const mapOrderToUpdatePayload = (
  order: Order,
  existingOrder?: Order
): OrderUpdatePayload => {
  const basePayload = mapOrderToPayload(order)
  const items = toOrderItemPayload(order.items, true)
  const additionalItems = toAdditionalItemPayload(order.additionalItems, true)

  const fullPayload: OrderUpdatePayload = {
    id: order.id,
    ...basePayload,
    items,
    ...(additionalItems.length ? { additionalItems } : {}),
  }

  if (!existingOrder) {
    return fullPayload
  }

  const existingPayload = mapOrderToPayload(existingOrder)
  const existingItems = toOrderItemPayload(existingOrder.items, true)
  const existingAdditionalItems = toAdditionalItemPayload(
    existingOrder.additionalItems,
    true
  )
  const diffPayload: OrderUpdatePayload = {
    id: order.id,
  }

  if (!isEqual(items, existingItems)) {
    diffPayload.items = items
  }

  if (!isEqual(additionalItems, existingAdditionalItems)) {
    diffPayload.additionalItems = additionalItems
  }

  ORDER_UPDATE_DIFF_FIELDS.forEach((field) => {
    if (!Object.is(basePayload[field], existingPayload[field])) {
      diffPayload[field] = basePayload[field]
    }
  })

  return diffPayload
}

export const toOrderItemPayload = (
  items?: Order['items'],
  includeIds = false
): OrderItemPayload[] =>
  items?.map((item) => ({
    ...(includeIds ? { id: item.id > 0 ? item.id : null } : {}),
    productId: item.product.productId,
    quantity: item.quantity,
  })) ?? []

export const toAdditionalItemPayload = (
  items?: Order['additionalItems'],
  includeIds = false
): OrderAdditionalItemPayload[] =>
  items?.map((item) => ({
    ...(includeIds ? { id: item.id > 0 ? item.id : null } : {}),
    additionalItemId: item.additionalItem.additionalItemId,
    quantity: item.quantity,
    returned: item.returned,
  })) ?? []
