/**
 * Ticket Number Generator
 * Standard format: TKT-YYYY-XXXXXX (e.g., TKT-2026-001041)
 */

export function generateTicketNumber(): string {
  const currentYear = new Date().getFullYear();
  // Generate a random 6-digit number or sequence
  const randomSixDigit = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${currentYear}-${randomSixDigit}`;
}

export function formatTicketTimestamp(dateString?: string): string {
  if (!dateString) return 'الآن';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}
