import { CHART_COLORS } from '../constants/defaults';

export function formatKs(amount: number): string {
  return `${amount.toLocaleString()} Ks`;
}

export function formatProfitLoss(value: number): { text: string; className: string } {
  const formatted = value.toLocaleString();
  if (value > 0) return { text: `+${formatted} Ks (Profit)`, className: 'profit-positive' };
  if (value < 0) return { text: `${formatted} Ks (Loss)`, className: 'profit-negative' };
  return { text: '0 Ks (Break Even)', className: 'profit-neutral' };
}

export function getSoldPrice(item: { soldPrice?: number; price?: number }): number {
  return item.soldPrice ?? item.price ?? 0;
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultDateRange(): { from: string; to: string } {
  const today = new Date();
  const fromDate = new Date();
  fromDate.setDate(today.getDate() - 2);
  return { from: formatDateInput(fromDate), to: formatDateInput(today) };
}

export function generateColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]);
}
