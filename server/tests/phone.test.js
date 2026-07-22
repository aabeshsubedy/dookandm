import { describe, it, expect } from 'vitest';
import { normalizePhone, phonesEqual } from '@dokaandm/shared';

describe('phone normalization (identity key)', () => {
  it('adds +977 to a bare 10-digit Nepali mobile', () => {
    expect(normalizePhone('9812345678')).toBe('+9779812345678');
    expect(normalizePhone('9712345678')).toBe('+9779712345678');
  });

  it('keeps an existing +977 number', () => {
    expect(normalizePhone('+977 9812345678')).toBe('+9779812345678');
  });

  it('strips spaces, dashes, and parentheses', () => {
    expect(normalizePhone('(981) 234-5678')).toBe('+9779812345678');
  });

  it('converts a leading 00 to +', () => {
    expect(normalizePhone('009779812345678')).toBe('+9779812345678');
  });

  it('handles 977-prefixed without plus', () => {
    expect(normalizePhone('9779812345678')).toBe('+9779812345678');
  });

  it('returns null for empty/too-short input', () => {
    expect(normalizePhone('')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone('123')).toBeNull();
  });

  it('treats different formats of the same number as equal', () => {
    expect(phonesEqual('9812345678', '+977-981-234-5678')).toBe(true);
    expect(phonesEqual('9812345678', '9800000000')).toBe(false);
  });
});
