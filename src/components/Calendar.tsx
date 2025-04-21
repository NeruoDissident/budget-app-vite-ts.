import React, { useState } from 'react';
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay, format, isToday } from 'date-fns';
import { Transaction } from '../data';
import styles from './Calendar.module.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarProps {
  selectedDay: string | null;
  onSelectDay: (d: string) => void;
  transactions: Transaction[];
  onAdd: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  editingTx: Transaction | null;
  setEditingTx: (tx: Transaction | null) => void;
  totalRemainingBudgets?: number;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDay, onSelectDay, transactions, onAdd, onEdit, onDelete, editingTx, setEditingTx, totalRemainingBudgets }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Get all days in the selected month
  const monthStart = startOfMonth(new Date(currentYear, currentMonth, 1));
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for the first week
  const firstDayOfWeek = getDay(monthStart); // 0 (Sun) - 6 (Sat)

  // Map of transactions by date
  const txByDate = React.useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      map[tx.date] = (map[tx.date] || 0) + tx.amount;
    });
    return map;
  }, [transactions]);

  // Compute running balances for each day in the month
  const balancesByDay = React.useMemo(() => {
    // Sort all transactions by date
    const sortedTxs = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let runningTotal = 0;
    const result: Record<string, { begin: number; end: number }> = {};
    // Build a map for all days up to the end of this month
    const allDays = eachDayOfInterval({
      start: new Date(currentYear, 0, 1),
      end: endOfMonth(monthEnd),
    });
    let txIdx = 0;
    for (const day of allDays) {
      const dateStr = day.toISOString().slice(0, 10);
      // Begin balance is before applying today's txs
      result[dateStr] = { begin: runningTotal, end: runningTotal };
      // Apply all txs for this day
      while (txIdx < sortedTxs.length && sortedTxs[txIdx].date === dateStr) {
        runningTotal += sortedTxs[txIdx].amount;
        txIdx++;
      }
      // End balance is after today's txs
      result[dateStr].end = runningTotal;
    }
    return result;
  }, [transactions, currentYear, currentMonth]);

  // Generate years for dropdown (e.g., +/- 5 years from today)
  const years = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);



  // Helper to get recurring transactions for a day
  const getRecurringForDay = (dateStr: string) => {
    return transactions.filter(tx => tx.date === dateStr && tx.recurring);
  };

  // Helper to get all transactions (recurring and one-off) for a day
  const getAllTxsForDay = (dateStr: string) => {
    return transactions.filter(tx => tx.date === dateStr);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <button
          className="rounded-full p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 shadow transition-colors focus:outline-none"
          aria-label="Previous Month"
          onClick={() => {
            if (currentMonth === 0) {
              setCurrentMonth(11);
              setCurrentYear(y => y - 1);
            } else {
              setCurrentMonth(m => m - 1);
            }
          }}
        >
          <span className="text-2xl text-blue-600 dark:text-blue-300">&#8592;</span>
        </button>
        <select
          className="border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          value={currentMonth}
          onChange={e => setCurrentMonth(Number(e.target.value))}
        >
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx}>{m}</option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          value={currentYear}
          onChange={e => setCurrentYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          className="rounded-full p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 shadow transition-colors focus:outline-none"
          aria-label="Next Month"
          onClick={() => {
            if (currentMonth === 11) {
              setCurrentMonth(0);
              setCurrentYear(y => y + 1);
            } else {
              setCurrentMonth(m => m + 1);
            }
          }}
        >
          <span className="text-2xl text-blue-600 dark:text-blue-300">&#8594;</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-4 bg-white dark:bg-gray-800 rounded shadow p-6">
        {/* Weekday headers */}
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <span key={d} className="text-xs font-semibold text-center text-gray-400 dark:text-gray-200">{d}</span>
        ))}
        {/* Padding for first week */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <span key={'pad-' + i}></span>
        ))}
        {/* Days of month */}
        {days.map((day, idx) => {
  const dateStr = day.toISOString().slice(0, 10);
  const begin = balancesByDay[dateStr]?.begin ?? 0;
  const end = balancesByDay[dateStr]?.end ?? 0;
  const dayTxs = getAllTxsForDay(dateStr);
  const recurringTxs = dayTxs.filter(tx => tx.recurring);
  const earnings = dayTxs.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const spending = dayTxs.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0);
  // Highlight if this is the currently edited day
  const isEditingDay = editingTx && editingTx.date === dateStr;
  // Determine if this is the last day of the week or month
  const isLastDayOfWeek = (idx + firstDayOfWeek + 1) % 7 === 0;
  const isLastDayOfMonth = idx === days.length - 1;
  return (
    <div key={dateStr} className="relative group">
      <button
        className={[
          styles.calendarDay,
          selectedDay === dateStr ? styles.selected : '',
          isEditingDay ? styles.editing : '',
          isToday(day) ? styles.today : '',
        ].join(' ')}
        style={isEditingDay ? {
          border: '2px solid #f59e42',
          background: '#fff7e6',
          color: '#b45309',
          boxShadow: '0 0 0 3px #f59e4277',
          zIndex: 2,
          position: 'relative',
        } : undefined}
        onClick={() => { onSelectDay(dateStr); }}
      >
        {recurringTxs.length > 0 && (
          <span className={styles.recurringIcon} title={recurringTxs.map(tx => tx.description).join(', ')}>
            🔁
          </span>
        )}
        <span className={styles.dayNumber}>{format(day, 'd')}</span>
        <span className={styles.balance} style={{ color: end >= 0 ? '#22c55e' : '#ef4444' }}>
          ${end.toFixed(2)}
        </span>
        {/* Show ending balance for last day of week/month */}
        {isLastDayOfWeek && !isLastDayOfMonth && (
          <>
            <span className={styles.weekEndBalance}>Week End: ${end.toFixed(2)}</span>
            <span className={styles.afterBudgetBalance}>
              After Budget: ${(end - (totalRemainingBudgets ?? 0)).toFixed(2)}
            </span>
          </>
        )}
        {isLastDayOfMonth && (
          <>
            <span className={styles.monthEndBalance}>Month End: ${end.toFixed(2)}</span>
            <span className={styles.afterBudgetBalance}>
              After Budget: ${(end - (totalRemainingBudgets ?? 0)).toFixed(2)}
            </span>
          </>
        )}
        <div className={styles.transactions}>
          {earnings > 0 && (
            <span className={styles.earnings}>
              <span role="img" aria-label="Earnings">💰</span> +${earnings.toFixed(2)}
            </span>
          )}
          {/* Show each spending category icon for the day's spending transactions */}
          {dayTxs.filter(tx => tx.amount < 0).map((tx, idx) => {
            const categoryIcons: Record<string, string> = {
              Groceries: "🛒",
              Food: "🍔",
              Restaurants: "🍔",
              Transport: "🚗",
              Rent: "🏠",
              Utilities: "💡",
              Entertainment: "🎬",
              Shopping: "🛍️",
              Health: "💊",
              Other: "💸",
              Uncategorized: "💸"
            };
            const icon = categoryIcons[tx.category || 'Uncategorized'] || "💸";
            return (
              <span key={tx.id} className={styles.spending}>
                <span role="img" aria-label={tx.category || 'Spending'}>{icon}</span> -${Math.abs(tx.amount).toFixed(2)}
              </span>
            );
          })}
        </div>

      </button>
    </div>
  );
        })}
      </div>
    </div>
  );
};

export default Calendar;
