/**
 * Phone normalization for Nepal-first customer identity resolution.
 * Pure functions — unit-tested. The normalized form is the primary CRM match key.
 *
 * Rules (pragmatic, not a full libphonenumber):
 *  - strip spaces, dashes, parens
 *  - a leading "00" becomes "+"
 *  - a leading "+" is kept
 *  - a bare 10-digit Nepali mobile (starts 97/98) gets +977
 *  - an already-prefixed 977… gets a "+"
 * Returns null if it cannot produce a plausible number.
 */
export function normalizePhone(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  s = s.replace(/[\s\-().]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);

  const hasPlus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7) return null; // too short to be real

  if (hasPlus) return '+' + digits;

  // Nepal country code already present
  if (digits.startsWith('977')) return '+' + digits;

  // Bare local Nepali mobile (10 digits, 97/98…)
  if (digits.length === 10 && (digits.startsWith('97') || digits.startsWith('98'))) {
    return '+977' + digits;
  }

  // Otherwise assume it's already an international number missing the plus
  return '+' + digits;
}

export function phonesEqual(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return na != null && na === nb;
}
