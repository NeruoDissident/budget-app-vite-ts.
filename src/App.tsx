import React, { useState, useMemo } from 'react';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import RecurringTab from './components/RecurringTab';
import BudgetsTab from './components/BudgetsTab';
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
  // Tab state for switching between calendar, recurring, budgets, graphs, and users
  const [tab, setTab] = useState<'calendar' | 'recurring' | 'budgets' | 'graphs' | 'users'>('calendar');
  // Recurring editing state
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  // Theme state: 'default', 'retro', 'synthwave'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'default';
    }
    return 'default';
  });

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

  // User state
  const [users, setUsers] = useState<User[]>(getUsers());
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(getCurrentUserId());

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

  // App data state
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>(() => loadRecurrings());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
  const [selectedDay, setSelectedDay] = useState<SelectedDay>(startOfToday().toISOString().slice(0, 10));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

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

  // Expand recurring transactions into dated instances
  const allTransactions = useMemo(() => {
    return addRecurringInstances(transactions, recurrings);
  }, [transactions, recurrings]);

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

  // Balances
  const balances = useMemo(() => computeBalances(allTransactions), [allTransactions]);

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
          <BudgetsTab tab={tab} transactions={allTransactions} />
        </main>
      )}
      {tab === 'graphs' && (
        <main className="flex-1 p-8 pt-24 flex justify-center items-start">
          <SpendingByCategoryChart transactions={allTransactions} />
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
