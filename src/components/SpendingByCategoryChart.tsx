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
  // Filter only expenses (amount < 0)
  const expenses = React.useMemo(() => transactions.filter(tx => tx.amount < 0), [transactions]);
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
    <div className={`w-full max-w-md mx-auto bg-white dark:bg-gray-900 rounded shadow p-6 ${styles.chartContainer}`}>
      <h2 className="text-xl font-bold mb-4 text-center">Spending by Category</h2>
      <Pie
        data={data}
        options={{
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'inherit', font: { size: 14 } }
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
