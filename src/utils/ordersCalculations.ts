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
 * Calculate price per plate (sum of all menu item line prices)
 *
 * USED IN:
 * - OrdersForm.tsx: Display "one_leaf_price" value
 * - calculateMenuItemsSubtotal: Base calculation
 */
export const calculatePricePerPlate = (order: Order): number => {
  const items = order.items || []

  if (items.length === 0) return 0

  return items.reduce((sum, item) => {
    const linePrice = item.totalPrice || item.unitPrice * item.quantity
    return sum + linePrice
  }, 0)
}

/**
 * Calculate one leaf price after reduction
 *
 * USED IN:
 * - OrdersForm.tsx: Display "one_leaf_price" in payment summary
 */
export const calculateOneLeafPrice = (order: Order): number => {
  const pricePerPlate = calculatePricePerPlate(order)
  const priceReducedPerPlate = order.priceReducedPerPlate || 0
  return Math.max(0, pricePerPlate + priceReducedPerPlate)
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
 *
 * USED IN:
 * - OrdersForm.tsx: useEffect for calculating totalAmount
 * - OrdersForm.tsx: Display "total_leaf_items_subtotal" in payment summary
 * - OrdersForm.tsx: getSubtotalBeforeDelivery helper
 * - ordersCalculations.ts: calculateOrderTotals
 */
export const calculateMenuItemsSubtotal = (order: Order): number => {
  const items = order.items || []
  const totalPlates = order.totalPlates || 1
  const priceReducedPerPlate = order.priceReducedPerPlate || 0

  if (items.length === 0) return 0

  // Step 1: Calculate price per plate (sum of all items)
  const pricePerPlate = calculatePricePerPlate(order)

  // Step 2: Apply reduction to price per plate
  const reducedPricePerPlate = Math.max(0, pricePerPlate + priceReducedPerPlate)

  // Step 3: Multiply by total plates
  return Math.round(reducedPricePerPlate * totalPlates)
}

/**
 * Additional Menu Items Subtotal = Sum of (product.price × quantity)
 *
 * USED IN:
 * - OrdersForm.tsx: Display "additional_menu_items_subtotal" in payment summary
 * - OrdersForm.tsx: getSubtotalBeforeDelivery helper
 * - ordersCalculations.ts: calculateOrderTotals, calculateSubtotalBeforeDelivery
 */
export const calculateAdditionalMenuItemsSubtotal = (
  order: Order,
  productsMapOrArray: Map<number, Product> | Product[]
): number => {
  const additionalMenuItems = order.additionalMenuItems || []

  if (additionalMenuItems.length === 0) return 0

  if (Array.isArray(productsMapOrArray)) {
    // Handle products array (from OrdersForm)
    return additionalMenuItems.reduce((sum, item) => {
      const product = productsMapOrArray.find((p) => p.id === item.productId)
      const price = product?.price ?? 0
      return sum + price * item.quantity
    }, 0)
  } else {
    // Handle products Map (from other places)
    return additionalMenuItems.reduce((sum, item) => {
      const product = productsMapOrArray.get(item.productId)
      const price = product?.price || 0
      return sum + price * item.quantity
    }, 0)
  }
}

/**
 * Additional Items Subtotal = Sum of (lineTotal for each item)
 *
 * USED IN:
 * - OrdersForm.tsx: Display "additional_items_subtotal" in payment summary
 * - OrdersForm.tsx: getSubtotalBeforeDelivery helper
 * - ordersCalculations.ts: calculateOrderTotals, calculateSubtotalBeforeDelivery
 */
export const calculateAdditionalItemsSubtotal = (order: Order): number => {
  const additionalItems = order.additionalItems || []

  if (additionalItems.length === 0) return 0

  return additionalItems.reduce((sum, item) => {
    const price = item.lineTotal || 0
    return sum + price
  }, 0)
}

/**
 * Calculate discount amount from percentage
 *
 * USED IN:
 * - OrdersForm.tsx: handleDiscountPercentageChange handler
 */
export const calculateDiscountFromPercentage = (
  subtotal: number,
  percentage: number
): number => {
  if (percentage <= 0) return 0
  return Math.round(subtotal * (percentage / 100))
}

/**
 * Calculate discount percentage from amount
 *
 * USED IN:
 * - OrdersForm.tsx: handleDiscountAmountChange handler
 */
export const calculateDiscountPercentageFromAmount = (
  subtotal: number,
  amount: number
): number => {
  if (subtotal <= 0 || amount <= 0) return 0
  return Math.round((amount / subtotal) * 100 * 100) / 100
}

/**
 * Subtotal Before Delivery = menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal
 *
 * USED IN:
 * - OrdersForm.tsx: Display "subtotal_before_delivery" in payment summary
 * - OrdersForm.tsx: Helper for discount calculations
 * - OrdersForm.tsx: useEffect for calculating totalAmount
 * - ordersCalculations.ts: calculateOrderTotals
 */
export const calculateSubtotalBeforeDelivery = (
  order: Order,
  productsMapOrArray?: Map<number, Product> | Product[]
): number => {
  const menuItemsSubtotal = calculateMenuItemsSubtotal(order)
  const additionalMenuItemsSubtotal = productsMapOrArray
    ? calculateAdditionalMenuItemsSubtotal(order, productsMapOrArray)
    : 0
  const additionalItemsSubtotal = calculateAdditionalItemsSubtotal(order)

  return (
    menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal
  )
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
