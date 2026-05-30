import { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { ChartType } from '../../types';
import { useApp } from '../../context/AppContext';
import { buildChartData, computeStats, filterSales } from '../../services/analyticsService';
import { formatKs, formatProfitLoss, getDefaultDateRange } from '../../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const CHART_BUTTONS: { type: ChartType; label: string }[] = [
  { type: 'productid', label: 'By ID' },
  { type: 'product', label: 'By Brand' },
  { type: 'category', label: 'By Category' },
  { type: 'timeseries-all', label: 'Time Series: All' },
  { type: 'timeseries-productid', label: 'Time Series: By ID' },
  { type: 'timeseries-product', label: 'Time Series: By Brand' },
  { type: 'timeseries-category', label: 'Time Series: By Category' },
];

export function AnalyticsPage() {
  const { sales, products, isAdmin, showModal } = useApp();
  const defaults = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [chartType, setChartType] = useState<ChartType>('product');

  const filteredSales = useMemo(
    () => filterSales(sales, dateFrom || null, dateTo || null),
    [sales, dateFrom, dateTo],
  );

  const stats = useMemo(
    () => computeStats(filteredSales, products),
    [filteredSales, products],
  );

  const chart = useMemo(
    () => buildChartData(chartType, filteredSales, sales, products),
    [chartType, filteredSales, sales, products],
  );

  const profitInfo = formatProfitLoss(stats.totalProfit);

  return (
    <div className="tab-content active">
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h2>Sales Analytics</h2>
          <div className="date-filter">
            <label htmlFor="date-from">From Date:</label>
            <input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <label htmlFor="date-to">To Date:</label>
            <input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button type="button" className="btn-apply-filter" onClick={() => { /* reactive */ }}>
              Apply Filter
            </button>
            <button
              type="button"
              className="btn-clear-filter"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear Filter
            </button>
          </div>
          <div className="chart-controls">
            {CHART_BUTTONS.map((btn) => (
              <button
                key={btn.type}
                type="button"
                className={`chart-btn ${chartType === btn.type ? 'active' : ''}`}
                onClick={() => setChartType(btn.type)}
              >
                {btn.label}
              </button>
            ))}
            {isAdmin && (
              <button type="button" className="btn-danger" onClick={() => showModal('clear-sales')}>
                Clear All Sale Data
              </button>
            )}
          </div>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p>{formatKs(stats.totalSales)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Transactions</h3>
            <p>{stats.totalTransactions}</p>
          </div>
          <div className="stat-card">
            <h3>Average Order</h3>
            <p>{formatKs(stats.averageOrder)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Items Sold</h3>
            <p>{stats.totalItems}</p>
          </div>
          <div className="stat-card">
            <h3>Total Profit</h3>
            <p className={profitInfo.className}>
              {stats.totalProfit > 0 ? '+' : ''}{stats.totalProfit.toLocaleString()} Ks
            </p>
          </div>
        </div>

        <div className="chart-container">
          {chart.type === 'bar' ? (
            <Bar data={chart.data as never} options={chart.options as never} />
          ) : (
            <Line data={chart.data as never} options={chart.options as never} />
          )}
        </div>
      </div>
    </div>
  );
}
