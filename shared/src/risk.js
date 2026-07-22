import { RISK_CONFIG } from './constants.js';

/**
 * COD risk scoring — pure, deterministic, rule-based (no ML).
 * Computed entirely from the seller's OWN order history for a customer.
 * This is a core differentiator; it is unit-tested exhaustively.
 *
 * @param {{ deliveredOrders:number, returnedOrders:number }} counts
 * @param {object} [config] override thresholds (defaults from RISK_CONFIG)
 * @returns {{ label:'new'|'reliable'|'medium'|'risky',
 *            totalCompleted:number, deliveredOrders:number,
 *            returnedOrders:number, returnRate:number }}
 */
export function scoreCodRisk(counts, config = RISK_CONFIG) {
  const delivered = Math.max(0, Number(counts?.deliveredOrders) || 0);
  const returned = Math.max(0, Number(counts?.returnedOrders) || 0);
  const totalCompleted = delivered + returned;

  // Guard divide-by-zero: return rate over completed (delivered + returned) orders.
  const returnRate = totalCompleted === 0 ? 0 : returned / totalCompleted;

  let label;
  if (totalCompleted < config.MIN_HISTORY) {
    label = 'new';
  } else if (
    returned >= config.RISKY_ABSOLUTE_RETURNS &&
    totalCompleted <= config.RISKY_ABSOLUTE_TOTAL
  ) {
    label = 'risky';
  } else if (returnRate > config.MEDIUM_MAX_RETURN_RATE) {
    label = 'risky';
  } else if (returnRate > config.RELIABLE_MAX_RETURN_RATE) {
    label = 'medium';
  } else {
    label = 'reliable';
  }

  return {
    label,
    totalCompleted,
    deliveredOrders: delivered,
    returnedOrders: returned,
    returnRate: Math.round(returnRate * 1000) / 1000,
  };
}

export const RISK_LABEL_META = {
  new: { label: 'New', tone: 'neutral', description: 'Not enough history to score yet.' },
  reliable: { label: 'Reliable', tone: 'good', description: 'Low return rate — safe for COD.' },
  medium: { label: 'Medium', tone: 'warn', description: 'Some returns — confirm before COD.' },
  risky: { label: 'Risky', tone: 'bad', description: 'High return rate — consider prepaid.' },
};
