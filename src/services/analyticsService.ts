import type { ChartData, ChartOptions } from 'chart.js';
import type { ChartType, Product, Sale } from '../types';
import { generateColors, getSoldPrice } from '../utils/format';

export interface AnalyticsStats {
  totalSales: number;
  totalTransactions: number;
  averageOrder: number;
  totalItems: number;
  totalProfit: number;
}

export function filterSales(
  sales: Sale[],
  dateFrom: string | null,
  dateTo: string | null,
): Sale[] {
  if (!dateFrom && !dateTo) return sales;

  return sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    saleDate.setHours(0, 0, 0, 0);

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      return saleDate >= fromDate && saleDate <= toDate;
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      return saleDate >= fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      return saleDate <= toDate;
    }
    return true;
  });
}

export function computeStats(filteredSales: Sale[], products: Product[]): AnalyticsStats {
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  const totalItems = filteredSales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  let totalProfit = 0;
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        totalProfit += (getSoldPrice(item) - (product.purchasedPrice || 0)) * item.quantity;
      }
    });
  });

  return { totalSales, totalTransactions, averageOrder, totalItems, totalProfit };
}

function formatDateKey(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  return `${month}/${day}/${year}`;
}

const ksTick = (value: string | number) => `${Number(value).toLocaleString()} Ks`;

const baseBarOptions = (title: string, tooltipExtra?: Record<string, number>): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: { display: true, text: title },
    legend: { display: false },
    tooltip: tooltipExtra
      ? {
          callbacks: {
            label(context) {
              const label = context.label || '';
              const value = context.parsed.y || 0;
              const quantity = tooltipExtra[label] || 0;
              return [`${label}: ${value.toLocaleString()} Ks`, `Sold Count: ${quantity.toLocaleString()} units`];
            },
          },
        }
      : undefined,
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { callback: ksTick },
    },
  },
});

export function buildChartData(
  chartType: ChartType,
  filteredSales: Sale[],
  allSales: Sale[],
  products: Product[],
): { type: 'bar' | 'line'; data: ChartData; options: ChartOptions } {
  if (chartType === 'category') {
    const salesByCategory: Record<string, number> = {};
    const quantityByCategory: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const amount = getSoldPrice(item) * item.quantity;
        salesByCategory[item.category] = (salesByCategory[item.category] || 0) + amount;
        quantityByCategory[item.category] = (quantityByCategory[item.category] || 0) + item.quantity;
      });
    });
    const sorted = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]);
    return {
      type: 'bar',
      data: {
        labels: sorted.map(([cat]) => cat),
        datasets: [{
          label: 'Sales (Ks)',
          data: sorted.map(([, val]) => val),
          backgroundColor: generateColors(sorted.length),
        }],
      },
      options: baseBarOptions('Sales by Category', quantityByCategory) as ChartOptions,
    };
  }

  if (chartType === 'product') {
    const salesByProduct: Record<string, number> = {};
    const quantityByProduct: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const amount = getSoldPrice(item) * item.quantity;
        salesByProduct[item.name] = (salesByProduct[item.name] || 0) + amount;
        quantityByProduct[item.name] = (quantityByProduct[item.name] || 0) + item.quantity;
      });
    });
    const sorted = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      type: 'bar',
      data: {
        labels: sorted.map(([name]) => name),
        datasets: [{
          label: 'Sales (Ks)',
          data: sorted.map(([, val]) => val),
          backgroundColor: generateColors(sorted.length),
        }],
      },
      options: baseBarOptions('Top 10 Products by Sales', quantityByProduct) as ChartOptions,
    };
  }

  if (chartType === 'productid') {
    const productIdMap: Record<string, string> = {};
    products.forEach((p) => {
      if (p.productCode) productIdMap[p.name] = p.productCode;
    });
    const salesById: Record<string, number> = {};
    const quantityById: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const id = productIdMap[item.name] || 'Unknown ID';
        const amount = getSoldPrice(item) * item.quantity;
        salesById[id] = (salesById[id] || 0) + amount;
        quantityById[id] = (quantityById[id] || 0) + item.quantity;
      });
    });
    const sorted = Object.entries(salesById).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      type: 'bar',
      data: {
        labels: sorted.map(([id]) => id),
        datasets: [{
          label: 'Sales (Ks)',
          data: sorted.map(([, val]) => val),
          backgroundColor: generateColors(sorted.length),
        }],
      },
      options: baseBarOptions('Top 10 Product IDs by Sales', quantityById) as ChartOptions,
    };
  }

  if (chartType === 'timeseries-all') {
    const salesByDate: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      const key = formatDateKey(sale.date);
      salesByDate[key] = (salesByDate[key] || 0) + sale.total;
    });
    const keys = Object.keys(salesByDate).sort();
    return {
      type: 'line',
      data: {
        labels: keys.map(formatDateLabel),
        datasets: [{
          label: 'Total Sales (Ks)',
          data: keys.map((k) => salesByDate[k]),
          borderColor: '#1e4976',
          backgroundColor: 'rgba(30, 73, 118, 0.08)',
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'Time Series Analysis: All Products Sales Over Time' },
          legend: { display: true, position: 'top' },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: ksTick } },
        },
      },
    };
  }

  // Multi-line time series charts
  const dateKeys = new Set<string>();
  allSales.forEach((sale) => dateKeys.add(formatDateKey(sale.date)));
  const sortedDates = [...dateKeys].sort();

  const buildMultiLine = (
    title: string,
    getKey: (item: Sale['items'][0]) => string,
  ) => {
    const seriesMap: Record<string, Record<string, number>> = {};
    filteredSales.forEach((sale) => {
      const dateKey = formatDateKey(sale.date);
      sale.items.forEach((item) => {
        const key = getKey(item);
        if (!seriesMap[key]) seriesMap[key] = {};
        const amount = getSoldPrice(item) * item.quantity;
        seriesMap[key][dateKey] = (seriesMap[key][dateKey] || 0) + amount;
      });
    });

    const keys = Object.keys(seriesMap);
    const colors = generateColors(keys.length);
    return {
      type: 'line' as const,
      data: {
        labels: sortedDates.map(formatDateLabel),
        datasets: keys.map((key, i) => ({
          label: key,
          data: sortedDates.map((d) => seriesMap[key][d] || 0),
          borderColor: colors[i],
          backgroundColor: colors[i] + '33',
          tension: 0.4,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: title },
          legend: { display: true, position: 'top' as const },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: ksTick } },
        },
      },
    };
  };

  if (chartType === 'timeseries-product') {
    return buildMultiLine(
      'Time Series Analysis: Sales by Brand',
      (item) => item.name,
    );
  }

  if (chartType === 'timeseries-category') {
    return buildMultiLine(
      'Time Series Analysis: Sales by Category',
      (item) => item.category,
    );
  }

  if (chartType === 'timeseries-productid') {
    const productIdMap: Record<string, string> = {};
    products.forEach((p) => {
      if (p.productCode) productIdMap[p.name] = p.productCode;
    });
    return buildMultiLine(
      'Time Series Analysis: Sales by Product ID',
      (item) => productIdMap[item.name] || 'Unknown ID',
    );
  }

  return {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {},
  };
}
