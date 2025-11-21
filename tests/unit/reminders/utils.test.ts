import { describe, expect, it } from 'vitest';

import {
  formatReminderDate,
  getReminderStatusColor,
  isOverdue
} from '@/features/reminders/utils';

describe('reminders utils', () => {
  describe('formatReminderDate', () => {
    it('should return "Overdue" for past dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      expect(formatReminderDate(pastDate)).toBe('Overdue');
    });

    it('should format minutes correctly', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 30).toISOString();
      const result = formatReminderDate(futureDate);
      expect(result).toContain('minute');
    });

    it('should format hours correctly', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString();
      const result = formatReminderDate(futureDate);
      expect(result).toContain('hour');
    });

    it('should format days correctly', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();
      const result = formatReminderDate(futureDate);
      expect(result).toContain('day');
    });

    it('should return locale date string for dates more than 7 days away', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString();
      const result = formatReminderDate(futureDate);
      expect(result).not.toContain('minute');
      expect(result).not.toContain('hour');
      expect(result).not.toContain('day');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isOverdue(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isOverdue(undefined)).toBe(false);
    });
  });

  describe('getReminderStatusColor', () => {
    it('should return correct color for scheduled status', () => {
      expect(getReminderStatusColor('scheduled')).toContain('blue');
    });

    it('should return correct color for sent status', () => {
      expect(getReminderStatusColor('sent')).toContain('green');
    });

    it('should return correct color for snoozed status', () => {
      expect(getReminderStatusColor('snoozed')).toContain('yellow');
    });

    it('should return correct color for dismissed status', () => {
      expect(getReminderStatusColor('dismissed')).toContain('slate');
    });
  });
});
