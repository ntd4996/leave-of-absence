import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function calculateHours(startDate: Date, endDate: Date) {
  const diffInMs = endDate.getTime() - startDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return Math.round(diffInHours);
}

export function formatNumber(number: number) {
  return new Intl.NumberFormat('vi-VN').format(number);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatPercent(number: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

export function calculatePercentage(value: number, total: number) {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function roundToDecimal(number: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
} 