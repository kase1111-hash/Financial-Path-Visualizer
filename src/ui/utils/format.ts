/**
 * Formatting Utilities
 *
 * Format numbers, currency, dates, and percentages for display.
 */

import type { Cents, Rate, MonthYear } from '@models/common';

/**
 * Format cents as currency string.
 */
export function formatCurrency(
  cents: Cents,
  options?: {
    showCents?: boolean;
    compact?: boolean;
    locale?: string;
  }
): string {
  const { showCents = false, compact = false, locale = 'en-US' } = options ?? {};
  const dollars = cents / 100;

  if (compact && Math.abs(dollars) >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(0)}K`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(dollars);
}

/**
 * Format rate as percentage string.
 */
export function formatPercent(
  rate: Rate,
  options?: {
    decimals?: number;
    locale?: string;
  }
): string {
  const { decimals = 1, locale = 'en-US' } = options ?? {};

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

/**
 * Format a number with commas.
 */
export function formatNumber(
  value: number,
  options?: {
    decimals?: number;
    locale?: string;
  }
): string {
  const { decimals = 0, locale = 'en-US' } = options ?? {};

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format MonthYear as string.
 */
export function formatMonthYear(
  date: MonthYear,
  format: 'MM/YYYY' | 'Month YYYY' | 'MMM YYYY' = 'MMM YYYY'
): string {
  const jsDate = new Date(date.year, date.month - 1);

  switch (format) {
    case 'MM/YYYY':
      return `${String(date.month).padStart(2, '0')}/${date.year}`;
    case 'Month YYYY':
      return jsDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case 'MMM YYYY':
      return jsDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

/**
 * Format hours as readable string.
 */
export function formatHours(hours: number): string {
  if (hours >= 2080) {
    const years = hours / 2080;
    return `${years.toFixed(1)} work years`;
  }
  if (hours >= 40) {
    const weeks = hours / 40;
    return `${weeks.toFixed(0)} work weeks`;
  }
  return `${hours.toFixed(0)} hours`;
}

/**
 * Format a date relative to now.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Parse currency string to cents.
 */
export function parseCurrency(value: string): Cents | null {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) return null;

  return Math.round(parsed * 100);
}

/**
 * Parse percentage string to rate.
 */
export function parsePercent(value: string): Rate | null {
  // Remove percent sign
  const cleaned = value.replace(/%/g, '').trim();
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) return null;

  return parsed / 100;
}

/**
 * Format file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
