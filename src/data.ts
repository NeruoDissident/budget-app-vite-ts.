import { addDays, eachDayOfInterval, endOfWeek, endOfMonth, endOfYear, isWithinInterval, parseISO, startOfToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category?: string;
  recurring?: boolean; // true for expanded recurring txs
  budgetId?: string;
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
  category?: string;
  budgetId?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number; // monthly budget amount
  month?: string; // YYYY-MM, if present applies only to that month
  recurring?: boolean; // if true, applies every month going forward
}

// ---- Multi-user Local Storage ----

export interface User {
  id: string;
  name: string;
}

export interface AppUserData {
  transactions: Transaction[];
  recurrings: RecurringTransaction[];
  categories: Category[];
  budgets: Budget[];
}

const USERS_KEY = 'budget-calendar-users';
const CURRENT_USER_KEY = 'budget-calendar-current-user';

// Get all users
export function getUsers(): User[] {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  } catch {
    return [];
  }
}

// Save user list
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current user ID
export function getCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

// Set current user ID
export function setCurrentUserId(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

// Create new user
export function createUser(name: string): User {
  const id = uuidv4();
  const user: User = { id, name };
  const users = getUsers();
  saveUsers([...users, user]);
  // Initialize empty data
  saveUserData(id, {
    transactions: [],
    recurrings: [],
    categories: [],
    budgets: [],
  });
  setCurrentUserId(id);
  return user;
}

// Delete user
export function deleteUser(id: string) {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  localStorage.removeItem(getUserDataKey(id));
  // If current user deleted, switch to first user if exists
  const current = getCurrentUserId();
  if (current === id) {
    if (users.length > 0) setCurrentUserId(users[0].id);
    else localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Get storage key for user data
function getUserDataKey(userId: string) {
  return `budget-calendar-user-${userId}`;
}

// Get user data
export function loadUserData(userId: string): AppUserData {
  try {
    const data = localStorage.getItem(getUserDataKey(userId));
    if (data) return JSON.parse(data);
    return { transactions: [], recurrings: [], categories: [], budgets: [] };
  } catch {
    return { transactions: [], recurrings: [], categories: [], budgets: [] };
  }
}

// Save user data
export function saveUserData(userId: string, data: AppUserData) {
  localStorage.setItem(getUserDataKey(userId), JSON.stringify(data));
}

// ---- Per-user Data Accessors ----

function getActiveUserData(): AppUserData {
  const userId = getCurrentUserId();
  if (!userId) return { transactions: [], recurrings: [], categories: [], budgets: [] };
  return loadUserData(userId);
}

function setActiveUserData(data: AppUserData) {
  const userId = getCurrentUserId();
  if (!userId) return;
  saveUserData(userId, data);
}

export function loadTransactions(): Transaction[] {
  return getActiveUserData().transactions;
}
export function saveTransactions(transactions: Transaction[]): void {
  const data = getActiveUserData();
  data.transactions = transactions;
  setActiveUserData(data);
}
export function loadRecurrings(): RecurringTransaction[] {
  return getActiveUserData().recurrings;
}
export function saveRecurrings(recurrings: RecurringTransaction[]): void {
  const data = getActiveUserData();
  data.recurrings = recurrings;
  setActiveUserData(data);
}
export function loadCategories(): Category[] {
  return getActiveUserData().categories;
}
export function saveCategories(categories: Category[]): void {
  const data = getActiveUserData();
  data.categories = categories;
  setActiveUserData(data);
}
export function loadBudgets(): Budget[] {
  return getActiveUserData().budgets;
}
export function saveBudgets(budgets: Budget[]): void {
  const data = getActiveUserData();
  data.budgets = budgets;
  setActiveUserData(data);
}

export function getBudgetForWeek(budgets: Budget[], weekStart: string): Budget[] {
  // Placeholder: implement logic if you want to support future week-specific budgets
  return budgets;
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
            recurring: true,
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
            recurring: true,
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
