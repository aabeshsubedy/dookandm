import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/** Money is stored as integer paisa; display as NPR. */
export function formatNpr(paisa, { decimals = false } = {}) {
  const rupees = (paisa || 0) / 100;
  return new Intl.NumberFormat('en-NP', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(rupees);
}

export function nprLabel(paisa, opts) {
  return `NPR ${formatNpr(paisa, opts)}`;
}

export function relativeTime(date) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

/** Compact inbox timestamp: time today, "Yesterday", or a short date. */
export function inboxTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function fullDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic avatar hue from a string, kept in the ocean/teal range. */
export function avatarStyle(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = 190 + (Math.abs(hash) % 40); // 190–230 (cyan→ocean)
  return { backgroundColor: `hsl(${hue} 55% 92%)`, color: `hsl(${hue} 60% 32%)` };
}
