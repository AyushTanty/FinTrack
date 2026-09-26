export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short'
  });
}

export function getCurrentMonthYear() {
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthName(month) {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleString('en-IN', { month: 'long' });
}

export function formatMonthYear(month, year) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}
