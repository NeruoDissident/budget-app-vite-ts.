import React, { useState, useMemo } from 'react';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import RecurringTab from './components/RecurringTab';
import BudgetsTab from './components/BudgetsTab';
import { Transaction, RecurringTransaction, loadData, saveData, computeBalances, addRecurringInstances } from './data';
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

const App: React.FC = () => {
  // Tab state for switching between calendar, recurring, budgets, and graphs
  const [tab, setTab] = useState<'calendar' | 'recurring' | 'budgets' | 'graphs'>('calendar');
  // Recurring editing state
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  // Theme state: 'default', 'retro', 'synthwave'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'default';
    }
    return 'default';
  });

  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'retro', 'synthwave');
    if (theme === 'retro') {
      html.classList.add('retro');
      localStorage.setItem('theme', 'retro');
    } else if (theme === 'synthwave') {
      html.classList.add('synthwave');
      localStorage.setItem('theme', 'synthwave');
    } else if (theme === 'dark') {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'default');
    }
  }, [theme]);

  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData('transactions'));
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>(() => loadData('recurrings'));
  const [selectedDay, setSelectedDay] = useState<SelectedDay>(startOfToday().toISOString().slice(0, 10));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Expand recurring transactions into dated instances
  const allTransactions = useMemo(() => {
    return addRecurringInstances(transactions, recurrings);
  }, [transactions, recurrings]);

  // Export/Import handlers
  const handleExport = () => {
    const categories = loadData('categories');
    const budgets = loadData('budgets');
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
        if (data.transactions) { setTransactions(data.transactions); saveData('transactions', data.transactions); }
        if (data.recurrings) { setRecurrings(data.recurrings); saveData('recurrings', data.recurrings); }
        if (data.categories) saveData('categories', data.categories);
        if (data.budgets) saveData('budgets', data.budgets);
        window.location.reload(); // reload to ensure all state is synced
      } catch (err) { alert('Invalid file.'); }
    };
    reader.readAsText(file);
  };

  // Save to localStorage on change
  React.useEffect(() => {
    saveData('transactions', transactions);
  }, [transactions]);
  React.useEffect(() => {
    saveData('recurrings', recurrings);
  }, [recurrings]);

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
          <BudgetsTab
            selectedDay={selectedDay!}
            setSelectedDay={setSelectedDay}
            transactions={allTransactions}
            onExport={handleExport}
            onImport={handleImport}
          />
        </main>
      )}
      {tab === 'graphs' && (
        <main className="flex-1 p-8 pt-24 flex justify-center items-start">
          <SpendingByCategoryChart transactions={allTransactions} />
        </main>
      )}
    </div>
  );
};

export default App;
