import { describe, it, expect } from 'vitest';
import { scoreCodRisk } from '@dokaandm/shared';

describe('COD risk scoring (core differentiator)', () => {
  it('labels a customer with no history as "new"', () => {
    const r = scoreCodRisk({ deliveredOrders: 0, returnedOrders: 0 });
    expect(r.label).toBe('new');
    expect(r.returnRate).toBe(0);
    expect(r.totalCompleted).toBe(0);
  });

  it('labels a customer below MIN_HISTORY as "new" even with a clean record', () => {
    const r = scoreCodRisk({ deliveredOrders: 1, returnedOrders: 0 });
    expect(r.label).toBe('new');
  });

  it('labels a customer with enough clean history as "reliable"', () => {
    const r = scoreCodRisk({ deliveredOrders: 5, returnedOrders: 0 });
    expect(r.label).toBe('reliable');
    expect(r.returnRate).toBe(0);
  });

  it('treats a 15% return rate as the reliable boundary', () => {
    // 3 returned / 20 total = 0.15 -> still reliable (<=)
    const r = scoreCodRisk({ deliveredOrders: 17, returnedOrders: 3 });
    expect(r.returnRate).toBe(0.15);
    expect(r.label).toBe('reliable');
  });

  it('labels a moderate return rate as "medium"', () => {
    // 4 returned / 20 = 0.20
    const r = scoreCodRisk({ deliveredOrders: 16, returnedOrders: 4 });
    expect(r.label).toBe('medium');
  });

  it('labels a high return rate as "risky"', () => {
    // 8 returned / 20 = 0.40 > 0.35
    const r = scoreCodRisk({ deliveredOrders: 12, returnedOrders: 8 });
    expect(r.label).toBe('risky');
  });

  it('applies the absolute-returns rule: >=2 returns within <=3 orders is risky', () => {
    // 2 returned / 3 total = 0.667 (also > 0.35) but the absolute rule catches
    // low-volume repeat refusers explicitly.
    const r = scoreCodRisk({ deliveredOrders: 1, returnedOrders: 2 });
    expect(r.label).toBe('risky');
    expect(r.totalCompleted).toBe(3);
  });

  it('does not fire the absolute rule on a single return in few orders', () => {
    // 1 returned / 2 total = 0.5 -> still risky by rate, but not by absolute rule
    const r = scoreCodRisk({ deliveredOrders: 1, returnedOrders: 1 });
    expect(r.totalCompleted).toBe(2);
    expect(r.label).toBe('risky'); // 0.5 > 0.35
  });

  it('guards divide-by-zero and clamps negatives', () => {
    const r = scoreCodRisk({ deliveredOrders: -5, returnedOrders: -2 });
    expect(r.returnRate).toBe(0);
    expect(r.label).toBe('new');
  });

  it('coerces non-numeric inputs safely', () => {
    const r = scoreCodRisk({ deliveredOrders: 'x', returnedOrders: undefined });
    expect(r.label).toBe('new');
  });

  it('rounds return rate to 3 decimals', () => {
    // 1 / 3 = 0.333...
    const r = scoreCodRisk({ deliveredOrders: 2, returnedOrders: 1 });
    expect(r.returnRate).toBe(0.333);
  });
});
