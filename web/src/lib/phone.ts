/** Digits-only phone for matching blocks and bookings. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatPhoneDisplay(raw: string): string {
  const d = normalizePhone(raw);
  if (d.length === 0) return raw;
  return d.startsWith('972') ? `+${d}` : raw.trim();
}
