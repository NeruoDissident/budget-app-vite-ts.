import React, { useState, useMemo } from 'react';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import RecurringTab from './components/RecurringTab';
import BudgetsTab from './components/BudgetsTab';
import GoalsTab, { Goal } from './components/GoalsTab';
import { Transaction, RecurringTransaction, computeBalances, addRecurringInstances } from './data';
import { startOfToday } from 'date-fns';

export type SelectedDay = string | null;

function downloadJSON(obj: any, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

import SpendingByCategoryChart from './components/SpendingByCategoryChart';

import {
  getUsers,
  getCurrentUserId,
  setCurrentUserId,
  createUser,
  deleteUser,
  loadTransactions,
  saveTransactions,
  loadRecurrings,
  saveRecurrings,
  loadCategories,
  saveCategories,
  loadBudgets,
  saveBudgets,
  User,
  Category,
  Budget
} from './data';
import UserManagementTab from './components/UserManagementTab';

const App: React.FC = () => {


  // Tab state for switching between calendar, recurring, budgets, graphs, goals, and users
  const [tab, setTab] = useState<'calendar' | 'recurring' | 'budgets' | 'graphs' | 'goals' | 'users'>('calendar');
  // Recurring editing state
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  // Theme state: 'default', 'retro', 'synthwave'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'default';
    }
    return 'default';
  });
  // User state
  const [users, setUsers] = useState<User[]>(getUsers());
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(getCurrentUserId());
  // App data state
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>(() => loadRecurrings());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());

  // Reload budgets from storage whenever Budgets tab is selected
  React.useEffect(() => {
    if (tab === 'budgets') {
      setBudgets(loadBudgets());
    }
  }, [tab]);
  const [selectedDay, setSelectedDay] = useState<SelectedDay>(startOfToday().toISOString().slice(0, 10));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Calculate total remaining budgets for the current month
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const totalRemainingBudgets = useMemo(() => {
    // Only count budgets for current month or recurring
    return budgets.reduce((sum, b) => {
      if (
        (b.month && b.month === currentMonth) ||
        (!b.month && !b.endMonth && b.recurring) ||
        (!b.month && !b.recurring)
      ) {
        return sum + b.amount;
      }
      // If budget has a range, check if currentMonth is in range
      if (b.month && b.endMonth) {
        if (b.month <= currentMonth && currentMonth <= b.endMonth) {
          return sum + b.amount;
        }
      }
      return sum;
    }, 0);
  }, [budgets, currentMonth]);

  // Remaining budget after subtracting spending for the current month
  const remainingBudgetThisMonth = useMemo(() => {
    const monthStr = new Date().toISOString().slice(0, 7);
    return budgets.reduce((sum, b) => {
      const catName = categories.find(c => c.id === b.categoryId)?.name;
      const spent = allTransactions
        .filter(tx => {
          const sameMonth = tx.date.slice(0, 7) === monthStr;
          const matches = tx.budgetId === b.id || (catName && tx.category === catName);
          return sameMonth && matches && tx.amount < 0;
        })
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
      return sum + (b.amount - spent);
    }, 0);
  }, [budgets, allTransactions, categories]);
  // Calculate months left in year
  const monthsLeftInYear = 12 - now.getMonth();

  // Expand recurring transactions into dated instances
  const allTransactions = useMemo(() => {
    return addRecurringInstances(transactions, recurrings);
  }, [transactions, recurrings]);

  // Balances
  const balances = useMemo(() => computeBalances(allTransactions), [allTransactions]);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem('goals');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  // Save goals to localStorage
  React.useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);
  // Add, edit, delete handlers
  const handleAddGoal = (goal: Goal) => setGoals(gs => [...gs, goal]);
  const handleEditGoal = (goal: Goal) => setGoals(gs => gs.map(g => g.id === goal.id ? goal : g));
  const handleDeleteGoal = (id: string) => setGoals(gs => gs.filter(g => g.id !== id));
  // Projected dates for goals
  // Calculate average net savings per month (income - expenses)
  const avgMonthlyNet = React.useMemo(() => {
    if (!allTransactions.length) return 0;
    const txsByMonth: Record<string, number> = {};
    allTransactions.forEach(tx => {
      const ym = tx.date.slice(0, 7);
      txsByMonth[ym] = (txsByMonth[ym] || 0) + tx.amount;
    });
    const months = Object.keys(txsByMonth);
    if (!months.length) return 0;
    const total = Object.values(txsByMonth).reduce((a, b) => a + b, 0);
    return total / months.length;
  }, [allTransactions]);
  // For each goal, project both optimistic and conservative dates
  const projectedDates: Record<string, { optimistic: string | null; conservative: string | null }> = React.useMemo(() => {
    const today = new Date();
    let currentBalance = balances.today;
    let conservativeBalance = balances.today - totalRemainingBudgets;
    // Conservative net: reduce avgMonthlyNet by budget spread over months left in year
    const months = monthsLeftInYear > 0 ? monthsLeftInYear : 1;
    const conservativeNet = avgMonthlyNet - (totalRemainingBudgets / months);
    const results: Record<string, { optimistic: string | null; conservative: string | null }> = {};
    goals.forEach(goal => {
      // Optimistic
      let optimistic: string | null = null;
      if (goal.target <= currentBalance) {
        optimistic = 'Goal already reached!';
      } else if (avgMonthlyNet > 0) {
        const monthsNeeded = Math.ceil((goal.target - currentBalance) / avgMonthlyNet);
        const projectedDate = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, today.getDate());
        optimistic = projectedDate.toISOString().slice(0, 10);
      }
      // Conservative
      let conservative: string | null = null;
      if (goal.target <= conservativeBalance) {
        conservative = 'Goal already reached!';
      } else if (conservativeNet > 0) {
        const monthsNeeded = Math.ceil((goal.target - conservativeBalance) / conservativeNet);
        const projectedDate = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, today.getDate());
        conservative = projectedDate.toISOString().slice(0, 10);
      }
      results[goal.id] = { optimistic, conservative };
    });
    return results;
  }, [goals, balances.today, avgMonthlyNet, totalRemainingBudgets, monthsLeftInYear]);

  // Apply theme to document body
  React.useEffect(() => {
    const body = document.body;
    body.classList.remove('retro', 'synthwave', 'dark');
    if (theme === 'retro') {
      body.classList.add('retro');
    } else if (theme === 'synthwave') {
      body.classList.add('synthwave');
    } else if (theme === 'dark') {
      body.classList.add('dark');
    }
    if (theme !== 'default') {
      localStorage.setItem('theme', theme);
    } else {
      localStorage.removeItem('theme');
    }
  }, [theme]);

  // Reload users from storage
  const reloadUsers = () => setUsers(getUsers());

  // On user change, reload all app data
  React.useEffect(() => {
    setCurrentUserIdState(getCurrentUserId());
    setTransactions(loadTransactions());
    setRecurrings(loadRecurrings());
    setCategories(loadCategories());
    setBudgets(loadBudgets());
  }, [currentUserId]);

  // User management handlers
  const handleCreateUser = (name: string) => {
    createUser(name);
    reloadUsers();
    setCurrentUserIdState(getCurrentUserId());
    setTab('calendar');
  };
  const handleSwitchUser = (id: string) => {
    setCurrentUserId(id);
    setCurrentUserIdState(id);
    setTab('calendar');
  };
  const handleDeleteUser = (id: string) => {
    deleteUser(id);
    reloadUsers();
    setCurrentUserIdState(getCurrentUserId());
    setTab('calendar');
  };

  // Save to localStorage on change
  React.useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);
  React.useEffect(() => {
    saveRecurrings(recurrings);
  }, [recurrings]);
  React.useEffect(() => {
    saveCategories(categories);
  }, [categories]);
  React.useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  // Export/Import handlers (per-user)
  const handleExport = () => {
    const data = {
      transactions,
      recurrings,
      categories,
      budgets,
    };
    downloadJSON(data, `budget-calendar-backup-${new Date().toISOString().slice(0,10)}.json`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (data.transactions) { setTransactions(data.transactions); }
        if (data.recurrings) { setRecurrings(data.recurrings); }
        if (data.categories) { setCategories(data.categories); }
        if (data.budgets) { setBudgets(data.budgets); }
      } catch (err) { alert('Invalid file.'); }
    };
    reader.readAsText(file);
  };

  // Get transactions for selected day
  const dayTxs = useMemo(() =>
    allTransactions.filter(tx => tx.date === selectedDay),
    [allTransactions, selectedDay]
  );


  // Projected end-of-month balance calculation
  const projectedEndOfMonthBalance = useMemo(() => {
    if (!allTransactions.length) return 0;
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const endOfMonthDate = new Date(year, month + 1, 0);
    // Only include transactions up to and including the last day of this month
    const txsUpToEndOfMonth = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate <= endOfMonthDate;
    });
    return txsUpToEndOfMonth.reduce((sum, tx) => sum + tx.amount, 0);
  }, [allTransactions]);

  // Transaction CRUD
  const handleAdd = (tx: Transaction) => setTransactions(ts => [...ts, tx]);
  const handleEdit = (tx: Transaction) => setTransactions(ts => ts.map(t => t.id === tx.id ? tx : t));
  const handleDelete = (id: string) => setTransactions(ts => ts.filter(t => t.id !== id));

  // Recurring CRUD
  const handleAddRecurring = (rt: RecurringTransaction) => setRecurrings(rs => [...rs, rt]);
  const handleEditRecurring = (rt: RecurringTransaction) => setRecurrings(rs => rs.map(r => r.id === rt.id ? rt : r));
  const handleDeleteRecurring = (id: string) => setRecurrings(rs => rs.filter(r => r.id !== id));

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Theme Selector */}
      <div className="fixed top-4 right-4 z-50">
        <select
          className="border rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 shadow"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="retro">Retro 8-bit</option>
          <option value="synthwave">Neon Synthwave</option>
        </select>
      </div>
      {/* Tabs */}
      <div className="absolute left-0 right-0 top-0 flex flex-col items-center mt-4 z-40">
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-t ${tab === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('calendar')}
          >
            Calendar
          </button>
          <button
            className={`px-4 py-2 rounded-t ${tab === 'recurring' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('recurring')}
          >
            Recurring Transactions
          </button>
          <button
            className={`px-4 py-2 rounded-t ${tab === 'budgets' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('budgets')}
          >
            Budgets
          </button>
          <button
            className={`px-4 py-2 rounded-t ${tab === 'graphs' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('graphs')}
          >
            Graphs
          </button>
          <button
            className={`px-4 py-2 rounded-t ${tab === 'goals' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('goals')}
          >
            Goals
          </button>
          <button
            className={`px-4 py-2 rounded-t ${tab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
        </div>
      </div>
      {/* Main content */}
      {tab === 'calendar' && (
        <>
          <Sidebar
            balances={balances}
            selectedDay={selectedDay}
            dayTxs={dayTxs}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingTx={editingTx}
            setEditingTx={setEditingTx}
            transactions={allTransactions}
            projectedEndOfMonthBalance={projectedEndOfMonthBalance}
            totalRemainingBudgets={remainingBudgetThisMonth}
            monthsLeftInYear={12 - new Date().getMonth()}
          />
          <main className="flex-1 p-8 pt-20 flex justify-center items-start">
            <Calendar
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              transactions={allTransactions}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingTx={editingTx}
              setEditingTx={setEditingTx}
              totalRemainingBudgets={totalRemainingBudgets}
            />
            
          </main>
        </>
      )}
      {tab === 'recurring' && (
        <main className="flex-1 p-8 pt-20 flex justify-center items-start">
          <RecurringTab
            recurrings={recurrings}
            onAddRecurring={handleAddRecurring}
            onEditRecurring={handleEditRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            editingRecurring={editingRecurring}
            setEditingRecurring={setEditingRecurring}
            selectedDay={selectedDay}
          />
        </main>
      )}
      {tab === 'budgets' && (
        <main className="flex-1 p-8 pt-20 flex justify-center items-start">
          <BudgetsTab transactions={allTransactions} />
        </main>
      )}
      {tab === 'graphs' && (
        <main className="flex-1 p-8 pt-24 flex justify-center items-start">
          <SpendingByCategoryChart transactions={allTransactions} />
        </main>
      )}
      {tab === 'goals' && (
        <main className="flex-1 p-8 pt-20 flex justify-center items-start">
          <GoalsTab
            goals={goals}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            projectedDates={projectedDates}
            showConservativeDates
            totalRemainingBudgets={totalRemainingBudgets}
            monthsLeftInYear={monthsLeftInYear}
          />
        </main>
      )}
      {tab === 'users' && (
        <main className="flex-1 p-8 pt-20 flex justify-center items-start">
          <UserManagementTab
            users={users}
            currentUserId={currentUserId || ''}
            onCreateUser={handleCreateUser}
            onSwitchUser={handleSwitchUser}
            onDeleteUser={handleDeleteUser}
          />
        </main>
      )}
    </div>
  );
};

export default App;
