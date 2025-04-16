import { addDays, eachDayOfInterval, endOfWeek, endOfMonth, endOfYear, isWithinInterval, parseISO, startOfToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
}

export type RecurrenceType = 'monthly' | 'biweekly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: RecurrenceType;
  dayOfMonth?: number; // for monthly
  dayOfWeek?: number; // for biweekly (0 = Sunday)
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// LocalStorage helpers
export function loadData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
export function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Expand recurring transactions into dated instances
export function addRecurringInstances(transactions: Transaction[], recurrings: RecurringTransaction[]): Transaction[] {
  let all = [...transactions];
  recurrings.forEach(rt => {
    const start = parseISO(rt.startDate);
    const end = rt.endDate ? parseISO(rt.endDate) : endOfYear(startOfToday());
    if (rt.type === 'monthly' && rt.dayOfMonth) {
      let d = new Date(start.getFullYear(), start.getMonth(), rt.dayOfMonth);
      while (d <= end) {
        if (d >= start && d <= end) {
          all.push({
            id: `recurring-${rt.id}-${d.toISOString().slice(0,10)}`,
            date: d.toISOString().slice(0,10),
            description: rt.description,
            amount: rt.amount,
          });
        }
        d = addDays(new Date(d.getFullYear(), d.getMonth() + 1, rt.dayOfMonth), 0);
      }
    } else if (rt.type === 'biweekly' && rt.dayOfWeek !== undefined) {
      let d = start;
      // Find first occurrence
      while (d.getDay() !== rt.dayOfWeek) d = addDays(d, 1);
      while (d <= end) {
        if (d >= start && d <= end) {
          all.push({
            id: `recurring-${rt.id}-${d.toISOString().slice(0,10)}`,
            date: d.toISOString().slice(0,10),
            description: rt.description,
            amount: rt.amount,
          });
        }
        d = addDays(d, 14);
      }
    }
  });
  return all;
}

export function computeBalances(transactions: Transaction[]) {
  const today = startOfToday().toISOString().slice(0,10);
  const weekEnd = endOfWeek(startOfToday()).toISOString().slice(0,10);
  const monthEnd = endOfMonth(startOfToday()).toISOString().slice(0,10);
  const yearEnd = endOfYear(startOfToday()).toISOString().slice(0,10);

  let balToday = 0, balWeek = 0, balMonth = 0, balYear = 0;
  transactions.forEach(tx => {
    if (tx.date <= today) balToday += tx.amount;
    if (tx.date <= weekEnd) balWeek += tx.amount;
    if (tx.date <= monthEnd) balMonth += tx.amount;
    if (tx.date <= yearEnd) balYear += tx.amount;
  });
  return {
    today: balToday,
    week: balWeek,
    month: balMonth,
    year: balYear,
  };
}
