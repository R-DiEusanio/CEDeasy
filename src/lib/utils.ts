export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Oggi'
  if (diffDays === 1) return 'Ieri'
  if (diffDays < 7) return `${diffDays} giorni fa`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function formatScheduledDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatScheduledTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
