// ─── Quantity/Unit Formatting ──────────────────────────────────────────────

const GRAM_TO_KG_THRESHOLD = 1000

export const formatQuantityForDisplay = (
  qty: number,
  unit?: string
): { qty: string; unit: string } => {
  const normalizedUnit = (unit ?? '').trim().toLowerCase()

  if (normalizedUnit === 'gram' || normalizedUnit === 'g' || normalizedUnit === 'grams') {
    if (qty >= GRAM_TO_KG_THRESHOLD) {
      return { qty: (qty / 1000).toFixed(2), unit: 'KG' }
    }
    return { qty: qty.toFixed(2), unit: 'Gram' }
  }

  if (normalizedUnit === 'kg' || normalizedUnit === 'kgs' || normalizedUnit === 'kilogram') {
    return { qty: qty.toFixed(2), unit: 'KG' }
  }

  if (normalizedUnit === 'piece') {
    return { qty: qty.toFixed(2), unit: 'piece' }
  }

  // Unknown unit — show as-is, no conversion
  return { qty: qty.toFixed(2), unit: unit ?? '' }
}