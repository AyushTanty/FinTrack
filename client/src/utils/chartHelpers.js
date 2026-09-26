import { formatCurrency } from './formatCurrency';

/**
 * Format axis currency labels cleanly without duplicate '₹1k' or '₹0k' issues
 */
export const formatAxisCurrency = (val) => {
  if (val === 0 || !val) return '₹0';
  const abs = Math.abs(val);
  if (abs >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `₹${val}`;
};

export const CHART_PALETTE = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316'  // Orange
];

export const darkTooltipStyle = {
  backgroundColor: '#0F172A',
  borderColor: '#334155',
  borderWidth: '1px',
  borderRadius: '8px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  color: '#F8FAFC',
  padding: '8px 12px',
  fontSize: '12px'
};
