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

/**
 * Centralized calculation logic for order totals
 * Works with the actual payload structure
 */
export const calculateOrderTotals = (
  order: Order,
  productsMap: Map<number, Product>
): CalculationBreakdown => {
  // Step 1: Calculate menu items subtotal
  const menuItemsSubtotal = calculateMenuItemsSubtotal(order)

  // Step 2: Calculate additional menu items subtotal
  const additionalMenuItemsSubtotal = calculateAdditionalMenuItemsSubtotal(
    order,
    productsMap
  )

  // Step 3: Calculate additional items subtotal
  const additionalItemsSubtotal = calculateAdditionalItemsSubtotal(order)

  // Step 4: Subtotal before delivery
  const subtotalBeforeDelivery =
    menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal

  // Step 5: Add delivery charge
  const deliveryCharge = order.deliveredByUs ? order.deliveryCharge || 0 : 0
  const grossTotal = subtotalBeforeDelivery + deliveryCharge

  // Step 6: Apply discount (use provided discountAmount from form, or calculate from percentage)
  let discountAmount = order.discountAmount || 0

  // If percentage is provided, calculate discount from percentage
  // If both are provided, use the discountAmount from the form (user intent)
  if (
    order.discountPercentage &&
    order.discountPercentage > 0 &&
    !order.discountAmount
  ) {
    discountAmount = Math.round(grossTotal * (order.discountPercentage / 100))
  }

  const totalAmount = Math.round(grossTotal - discountAmount)

  // Step 7: Calculate balance
  const advanceAmount = order.advanceAmount || 0
  const balanceAmount = Math.round(totalAmount - advanceAmount)

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
 * Menu Items Subtotal = (pricePerPlate - priceReducedPerPlate) × totalPlates
 *
 * Where:
 * - pricePerPlate = Sum of (unitPrice × quantity) for all items
 * - priceReducedPerPlate = reduction applied to the total per-plate price
 * - totalPlates = number of plates
 *
 * Flow:
 * 1. Sum all item prices: Σ(unitPrice × quantity)
 * 2. Subtract priceReducedPerPlate from that sum (once)
 * 3. Multiply by totalPlates
 */
export const calculateMenuItemsSubtotal = (
  order: Order,
): number => {
  const items = order.items || []
  const totalPlates = order.totalPlates || 1
  const priceReducedPerPlate = order.priceReducedPerPlate || 0

  if (items.length === 0) return 0

  // Step 1: Calculate price per plate (sum of all items)
  const pricePerPlate = items.reduce((sum, item) => {
    const unitPrice =
      item.unitPrice ||
      (item.quantity > 0 ? item.totalPrice / item.quantity : 0)

    return sum + unitPrice * item.quantity
  }, 0)

  // Step 2: Apply reduction to price per plate
  const reducedPricePerPlate = Math.max(0, pricePerPlate - priceReducedPerPlate)

  // Step 3: Multiply by total plates
  return Math.round(reducedPricePerPlate * totalPlates)
}

/**
 * Additional Menu Items Subtotal = Sum of (product.price × quantity)
 */
export const calculateAdditionalMenuItemsSubtotal = (
  order: Order,
  productsMap: Map<number, Product>
): number => {
  const additionalMenuItems = order.additionalMenuItems || []

  if (additionalMenuItems.length === 0) return 0

  return additionalMenuItems.reduce((sum, item) => {
    const product = productsMap.get(item.productId)
    const price = product?.price || 0
    return sum + price * item.quantity
  }, 0)
}

/**
 * Additional Items Subtotal = Sum of (priceAtOrder × quantity)
 */
export const calculateAdditionalItemsSubtotal = (order: Order): number => {
  const additionalItems = order.additionalItems || []

  if (additionalItems.length === 0) return 0

  return additionalItems.reduce((sum, item) => {
    const price = item.priceAtOrder || 0
    return sum + price * item.quantity
  }, 0)
}

/**
 * Format currency for display
 */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)
