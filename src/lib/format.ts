export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(value)

export const getCourseStartingPrice = (
  plans?: Array<{ price: number }> | null,
) => {
  if (!plans?.length) return null
  return Math.min(...plans.map((plan) => plan.price))
}

export const formatDurationDays = (days: number) =>
  days === 1 ? '1 day' : `${days} days`
