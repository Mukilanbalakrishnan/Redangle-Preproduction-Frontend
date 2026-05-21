export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-GB')
}

export const formatLabel = (value?: string | null) => {
  const text = String(value || '').trim()
  if (!text) return '-'
  return text.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

export const flowBadgeLabel = (flowType?: string) =>
  flowType === 'pre_wedding' ? 'Pre-wedding' : flowType === 'post_wedding' ? 'Post-wedding' : 'Not selected'
