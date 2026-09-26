import { formatCurrency } from './formatCurrency';

export function formatTransactionAmount(type, amount) {
  const formatted = formatCurrency(amount);
  if (type === 'income') return { display: '+' + formatted, colorClass: 'text-success' };
  if (type === 'expense') return { display: '-' + formatted, colorClass: 'text-danger' };
  return { display: formatted, colorClass: 'text-muted' };
}
