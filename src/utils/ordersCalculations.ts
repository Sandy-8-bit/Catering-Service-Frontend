import type { Order } from '@/types/order'
import type { Product } from '@/types/product'

interface CalculationBreakdown {
  menuItemsSubtotal: number
  additionalMenuItemsSubtotal: number
  additionalItemsSubtotal: number
  subtotalBeforeDelivery: number
  deliveryCharge: number
  grossTotal: number
  discountAmount: number
  totalAmount: number
  balanceAmount: number
}

export const calculateOrderTotals = (
  order: Order,
  productsMap: Map<number, Product>
): CalculationBreakdown => {
  const menuItemsSubtotal = calculateMenuItemsSubtotal(order)

  const additionalMenuItemsSubtotal =
    calculateAdditionalMenuItemsSubtotal(order, productsMap)

  const additionalItemsSubtotal =
    calculateAdditionalItemsSubtotal(order)

  const subtotalBeforeDelivery =
    menuItemsSubtotal +
    additionalMenuItemsSubtotal +
    additionalItemsSubtotal

  const deliveryCharge =
    order.deliveredByUs ? order.deliveryCharge || 0 : 0

  const grossTotal = subtotalBeforeDelivery + deliveryCharge

  let discountAmount = order.discountAmount || 0

  if (
    order.discountPercentage &&
    order.discountPercentage > 0 &&
    !order.discountAmount
  ) {
    discountAmount = Math.round(
      grossTotal * (order.discountPercentage / 100)
    )
  }

  const totalAmount = Math.round(
    grossTotal - discountAmount
  )

  const advanceAmount = order.advanceAmount || 0

  const balanceAmount = Math.round(
    totalAmount - advanceAmount
  )

  return {
    menuItemsSubtotal,
    additionalMenuItemsSubtotal,
    additionalItemsSubtotal,
    subtotalBeforeDelivery,
    deliveryCharge,
    grossTotal,
    discountAmount,
    totalAmount,
    balanceAmount,
  }
}

/**
 * Menu Items Subtotal
 * Sum of all item totals
 */
export const calculateMenuItemsSubtotal = (
  order: Order
): number => {
  const items = order.items || []

  if (items.length === 0) return 0

  return items.reduce((sum, item) => {
    const linePrice =
      item.totalPrice || item.unitPrice * item.quantity

    return sum + linePrice
  }, 0)
}

export const calculateAdditionalMenuItemsSubtotal = (
  order: Order,
  productsMapOrArray: Map<number, Product> | Product[]
): number => {
  const additionalMenuItems =
    order.additionalMenuItems || []

  if (additionalMenuItems.length === 0) return 0

  if (Array.isArray(productsMapOrArray)) {
    return additionalMenuItems.reduce((sum, item) => {
      const product = productsMapOrArray.find(
        (p) => p.id === item.productId
      )

      const price = product?.price ?? 0

      return sum + price * item.quantity
    }, 0)
  }

  return additionalMenuItems.reduce((sum, item) => {
    const product = productsMapOrArray.get(item.productId)

    const price = product?.price || 0

    return sum + price * item.quantity
  }, 0)
}

export const calculateAdditionalItemsSubtotal = (
  order: Order
): number => {
  const additionalItems = order.additionalItems || []

  if (additionalItems.length === 0) return 0

  return additionalItems.reduce((sum, item) => {
    return sum + (item.lineTotal || 0)
  }, 0)
}

export const calculateDiscountFromPercentage = (
  subtotal: number,
  percentage: number
): number => {
  if (percentage <= 0) return 0

  return Math.round(subtotal * (percentage / 100))
}

export const calculateDiscountPercentageFromAmount = (
  subtotal: number,
  amount: number
): number => {
  if (subtotal <= 0 || amount <= 0) return 0

  return Math.round((amount / subtotal) * 100 * 100) / 100
}

export const calculateSubtotalBeforeDelivery = (
  order: Order,
  productsMapOrArray?: Map<number, Product> | Product[]
): number => {
  const menuItemsSubtotal =
    calculateMenuItemsSubtotal(order)

  const additionalMenuItemsSubtotal =
    productsMapOrArray
      ? calculateAdditionalMenuItemsSubtotal(
          order,
          productsMapOrArray
        )
      : 0

  const additionalItemsSubtotal =
    calculateAdditionalItemsSubtotal(order)

  return (
    menuItemsSubtotal +
    additionalMenuItemsSubtotal +
    additionalItemsSubtotal
  )
}

export const formatCurrency = (
  value: number
): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)