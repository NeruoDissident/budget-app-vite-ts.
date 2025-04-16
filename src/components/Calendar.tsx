import React from 'react';
import { eachDayOfInterval, startOfYear, endOfYear, format, isToday } from 'date-fns';
import { Transaction } from '../data';

interface CalendarProps {
  year: number;
  selectedDay: string | null;
  onSelectDay: (d: string) => void;
  transactions: Transaction[];
}

const Calendar: React.FC<CalendarProps> = ({ year, selectedDay, onSelectDay, transactions }) => {
  const days = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  const txByDate = React.useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(tx => {
      map[tx.date] = (map[tx.date] || 0) + tx.amount;
    });
    return map;
  }, [transactions]);

  return (
    <div className="grid grid-cols-7 gap-1 bg-white rounded shadow p-2">
      {days.map(day => {
        const dateStr = day.toISOString().slice(0, 10);
        const bal = txByDate[dateStr] || 0;
        return (
          <button
            key={dateStr}
            className={`h-14 w-full flex flex-col items-center justify-center rounded border
              ${selectedDay === dateStr ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
              ${isToday(day) ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => onSelectDay(dateStr)}
          >
            <span className="text-xs text-gray-500">{format(day, 'MMM d')}</span>
            <span className={`text-sm ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{bal !== 0 ? bal.toFixed(2) : ''}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Calendar;
