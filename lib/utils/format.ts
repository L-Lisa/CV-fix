// Shared formatting utilities.

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
