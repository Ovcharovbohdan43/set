import { describe, expect, it } from 'vitest';

import { formatDaysRemaining, getGoalStatusColor, getGoalStatusBgColor } from '@/features/goals/utils';

describe('goals utils', () => {
  describe('formatDaysRemaining', () => {
    it('should return "No target date" when days is null', () => {
      expect(formatDaysRemaining(null)).toBe('No target date');
    });

    it('should return "No target date" when days is undefined', () => {
      expect(formatDaysRemaining(undefined)).toBe('No target date');
    });

    it('should return "Overdue" when days is negative', () => {
      expect(formatDaysRemaining(-5)).toBe('Overdue');
    });

    it('should return "Due today" when days is 0', () => {
      expect(formatDaysRemaining(0)).toBe('Due today');
    });

    it('should return "1 day left" when days is 1', () => {
      expect(formatDaysRemaining(1)).toBe('1 day left');
    });

    it('should return formatted string for multiple days', () => {
      expect(formatDaysRemaining(5)).toBe('5 days left');
      expect(formatDaysRemaining(30)).toBe('30 days left');
    });
  });

  describe('getGoalStatusColor', () => {
    it('should return correct color for active status', () => {
      expect(getGoalStatusColor('active')).toContain('blue');
    });

    it('should return correct color for paused status', () => {
      expect(getGoalStatusColor('paused')).toContain('yellow');
    });

    it('should return correct color for achieved status', () => {
      expect(getGoalStatusColor('achieved')).toContain('green');
    });

    it('should return correct color for abandoned status', () => {
      expect(getGoalStatusColor('abandoned')).toContain('red');
    });
  });

  describe('getGoalStatusBgColor', () => {
    it('should return correct background color for active status', () => {
      expect(getGoalStatusBgColor('active')).toContain('blue');
    });

    it('should return correct background color for paused status', () => {
      expect(getGoalStatusBgColor('paused')).toContain('yellow');
    });

    it('should return correct background color for achieved status', () => {
      expect(getGoalStatusBgColor('achieved')).toContain('green');
    });

    it('should return correct background color for abandoned status', () => {
      expect(getGoalStatusBgColor('abandoned')).toContain('red');
    });
  });
});

