import React, { useState } from 'react';
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay, format, isToday } from 'date-fns';
import { Transaction } from '../data';

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
}

const Calendar: React.FC<CalendarProps> = ({ selectedDay, onSelectDay, transactions, onAdd, onEdit, onDelete, editingTx, setEditingTx }) => {
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
        {days.map(day => {
           const dateStr = day.toISOString().slice(0, 10);
           const bal = txByDate[dateStr] || 0;
           const begin = balancesByDay[dateStr]?.begin ?? 0;
           const end = balancesByDay[dateStr]?.end ?? 0;
           const dayTxs = getAllTxsForDay(dateStr);
           const recurringTxs = dayTxs.filter(tx => tx.recurring);
           return (
             <div key={dateStr} className="relative group">
                <button
                  className={`h-32 w-full flex flex-col items-start justify-start rounded border transition-colors p-2 overflow-hidden text-left
                    ${selectedDay === dateStr ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-700'}
                    ${isToday(day) ? 'ring-2 ring-blue-400' : ''} bg-white dark:bg-gray-900`}
                  onClick={() => { onSelectDay(dateStr); }}
                >
                 {/* Recurring icon if present */}
                 {recurringTxs.length > 0 && (
                   <span className="absolute top-2 left-2 text-lg" title={recurringTxs.map(tx => tx.description).join(', ')}>
                     🔁
                   </span>
                 )}
                 <span className="text-base font-semibold text-gray-700 dark:text-gray-100 ml-6">{format(day, 'd')}</span>
                 <span className="text-xs text-gray-400 mt-1">Begin: <span className={begin >= 0 ? 'text-green-600' : 'text-red-600'}>${begin.toFixed(2)}</span></span>
                 <span className="text-xs text-gray-400">End: <span className={end >= 0 ? 'text-green-600' : 'text-red-600'}>${end.toFixed(2)}</span></span>
                 {/* Show up to 2 transactions as a preview */}
                 <ul className="mt-2 space-y-1 w-full">
                   {dayTxs.slice(0, 2).map(tx => (
                     <li key={tx.id} className="truncate text-xs flex items-center">
                       <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>{tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}</span>
                       <span className="ml-1 truncate">{tx.description}</span>
                       {tx.recurring && <span className="ml-1" title="Recurring">🔁</span>}
                     </li>
                   ))}
                   {dayTxs.length > 2 && <li className="text-xs text-gray-500">+${dayTxs.length - 2} more...</li>}
                 </ul>
               </button>

             </div>
           );
         })}
      </div>
    </div>
  );
};

export default Calendar;
