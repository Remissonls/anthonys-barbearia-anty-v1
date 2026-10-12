import { describe, it, expect } from 'vitest';
import { normalizePhoneBR, formatPhoneBR, isValidPhoneBR } from '../utils/phone';
import { formatBRL, parseBRLToCents } from '../utils/currency';
import { isStatusBlocking } from '../utils/availability';

describe('Business Rules & Integrity', () => {
  describe('Phone Normalization and Validation', () => {
    it('normalizes Brazilian phones by removing symbols and non-digits', () => {
      expect(normalizePhoneBR('(82) 99876-5432')).toBe('82998765432');
      expect(normalizePhoneBR('+55 (11) 91234-5678')).toBe('5511912345678');
      expect(normalizePhoneBR('82 98888 7777')).toBe('82988887777');
      expect(normalizePhoneBR('')).toBe('');
    });

    it('formats phone numbers into Brazilian pattern', () => {
      expect(formatPhoneBR('82998765432')).toBe('(82) 99876-5432');
      expect(formatPhoneBR('8232211234')).toBe('(82) 3221-1234');
    });

    it('validates Brazilian phone lengths correctly', () => {
      expect(isValidPhoneBR('82998765432')).toBe(true);
      expect(isValidPhoneBR('(82) 99876-5432')).toBe(true);
      expect(isValidPhoneBR('8232211234')).toBe(true);
      expect(isValidPhoneBR('12345')).toBe(false);
      expect(isValidPhoneBR('')).toBe(false);
    });
  });

  describe('Currency & Price in Cents (Section 8)', () => {
    it('formats integer cents into BRL currency format', () => {
      expect(formatBRL(4500)).toBe('R$\u00a045,00');
      expect(formatBRL(7000)).toBe('R$\u00a070,00');
      expect(formatBRL(0)).toBe('R$\u00a00,00');
    });

    it('parses input currency into cents accurately without float issues', () => {
      expect(parseBRLToCents('45,00')).toBe(4500);
      expect(parseBRLToCents('R$ 70,50')).toBe(7050);
      expect(parseBRLToCents('120')).toBe(12000);
    });
  });

  describe('Appointment Status and Occupancy (Section 10.4)', () => {
    it('occupies timeslot for pending, confirmed, in_progress', () => {
      expect(isStatusBlocking('pending')).toBe(true);
      expect(isStatusBlocking('confirmed')).toBe(true);
      expect(isStatusBlocking('in_progress')).toBe(true);
    });

    it('releases timeslot for completed, cancelled, no_show', () => {
      expect(isStatusBlocking('completed')).toBe(false);
      expect(isStatusBlocking('cancelled')).toBe(false);
      expect(isStatusBlocking('no_show')).toBe(false);
    });
  });
});
