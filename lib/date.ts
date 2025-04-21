export function getWeekDates() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(now);
  friday.setDate(now.getDate() - now.getDay() + 5);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

export function getMonthDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return { firstDay, lastDay };
}

export function getLastMonthDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  return { firstDay, lastDay };
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