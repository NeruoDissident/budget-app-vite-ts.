import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Transaction } from '../data';
import styles from './SpendingByCategoryChart.module.css';

Chart.register(ArcElement, Tooltip, Legend);

interface SpendingByCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  '#4F8A8B', '#FBD46D', '#F76B8A', '#A3A847', '#6A2C70', '#FF6F3C', '#3A86FF', '#FF006E', '#8338EC', '#FB5607', '#FFBE0B',
];

export const SpendingByCategoryChart: React.FC<SpendingByCategoryChartProps> = ({ transactions }) => {
  // Date range state
  const sortedTxs = React.useMemo(() => [...transactions].sort((a, b) => a.date.localeCompare(b.date)), [transactions]);
  const initialStart = sortedTxs.length ? sortedTxs[0].date : '';
  const initialEnd = sortedTxs.length ? sortedTxs[sortedTxs.length - 1].date : '';
  const [startDate, setStartDate] = React.useState(initialStart);
  const [endDate, setEndDate] = React.useState(initialEnd);

  // Dynamically set legend color based on theme
  const [legendColor, setLegendColor] = React.useState('#222');
  React.useEffect(() => {
    const body = document.body;
    if (body.classList.contains('retro')) setLegendColor('#33ff33');
    else if (body.classList.contains('synthwave')) setLegendColor('#fffb96');
    else if (body.classList.contains('dark')) setLegendColor('#f3f4f6');
    else setLegendColor('#222');
    // Listen for class changes (theme switch)
    const observer = new MutationObserver(() => {
      if (body.classList.contains('retro')) setLegendColor('#33ff33');
      else if (body.classList.contains('synthwave')) setLegendColor('#fffb96');
      else if (body.classList.contains('dark')) setLegendColor('#f3f4f6');
      else setLegendColor('#222');
    });
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Filter only expenses (amount < 0) within date range
  const expenses = React.useMemo(() => {
    return transactions.filter(tx => {
      if (tx.amount >= 0) return false;
      if (!startDate || !endDate) return true;
      return tx.date >= startDate && tx.date <= endDate;
    });
  }, [transactions, startDate, endDate]);
  const totalsByCategory = React.useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(tx => {
      const cat = tx.category || 'Uncategorized';
      totals[cat] = (totals[cat] || 0) + Math.abs(tx.amount);
    });
    return totals;
  }, [expenses]);
  const categories = React.useMemo(() => Object.keys(totalsByCategory), [totalsByCategory]);
  const data = React.useMemo(() => ({
    labels: categories,
    datasets: [
      {
        data: categories.map(cat => totalsByCategory[cat]),
        backgroundColor: COLORS,
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  }), [categories, totalsByCategory]);
  if (expenses.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded shadow p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
        <p className="text-gray-500 dark:text-gray-400">No expense data yet. Add some spending transactions to see your chart!</p>
      </div>
    );
  }
  return (
    <div className={`w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded shadow p-6 ${styles.chartContainer} text-gray-900 dark:text-gray-100 retro:text-[#33ff33] synthwave:text-[#fffb96]`}>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <label className="text-sm font-medium">Start:
          <input type="date" className="ml-2 border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 retro:bg-black retro:text-[#33ff33] synthwave:bg-[#2d1836] synthwave:text-[#fffb96]" value={startDate} min={initialStart} max={endDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label className="text-sm font-medium">End:
          <input type="date" className="ml-2 border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 retro:bg-black retro:text-[#33ff33] synthwave:bg-[#2d1836] synthwave:text-[#fffb96]" value={endDate} min={startDate} max={initialEnd} onChange={e => setEndDate(e.target.value)} />
        </label>
      </div>
      <h2 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100 retro:text-[#33ff33] synthwave:text-[#fffb96]">Spending by Category</h2>
      <Pie
        data={data}
        options={{
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: legendColor,
                font: { size: 14 }
              }
            },
          },
          responsive: true,
          // Remove maintainAspectRatio: false so the chart fits the container
        }}
        height={420}
        width={350}
        className={styles.pieChartCanvas}
      />
    </div>
  );
};

export default SpendingByCategoryChart;
