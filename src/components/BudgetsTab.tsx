import React, { useState, useEffect } from 'react';
import { loadCategories, loadBudgets, saveBudgets, saveCategories, Budget, Category } from '../data';

function getMonthLabel(month: string) {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}
function getPrevMonth(month: string) {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 2, 1);
  return d.toISOString().slice(0, 7);
}
function getNextMonth(month: string) {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m, 1);
  return d.toISOString().slice(0, 7);
}
function genId() { return Math.random().toString(36).slice(2); }

import { Transaction } from '../data';
interface BudgetsTabProps {
  tab: string;
  transactions: Transaction[];
}
const BudgetsTab: React.FC<BudgetsTabProps> = ({ tab, transactions }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM
  });
  const [recurrence, setRecurrence] = useState<'this'|'recurring'|'range'>('this');
  const [rangeStart, setRangeStart] = useState(month);
  const [rangeEnd, setRangeEnd] = useState(month);
  const [newCatName, setNewCatName] = useState('');

  // Reload categories and budgets whenever tab changes to 'budgets'
  useEffect(() => {
    if (tab === 'budgets') {
      setCategories(loadCategories());
      setBudgets(loadBudgets());
    }
  }, [tab]);

  // Add new budget
  const handleAdd = () => {
    if (!selectedCategory || !amount || isNaN(Number(amount))) return;
    const newBudget: Budget = {
      id: Math.random().toString(36).slice(2),
      categoryId: selectedCategory,
      amount: Number(amount)
    };
    const updated = [...budgets, newBudget];
    setBudgets(updated);
    saveBudgets(updated);
    setSelectedCategory('');
    setAmount('');
  };

  // Edit budget
  const handleEdit = (id: string) => {
    if (!editAmount || isNaN(Number(editAmount))) return;
    const updated = budgets.map(b => b.id === id ? { ...b, amount: Number(editAmount) } : b);
    setBudgets(updated);
    saveBudgets(updated);
    setEditingId(null);
    setEditAmount('');
  };

  // Delete budget
  const handleDelete = (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    saveBudgets(updated);
  };





    return (
    <div className="w-full max-w-xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button className="text-xl px-2" onClick={() => setMonth(getPrevMonth(month))}>&lt;</button>
        <h2 className="text-2xl font-bold">Budgets for {getMonthLabel(month)}</h2>
        <button className="text-xl px-2" onClick={() => setMonth(getNextMonth(month))}>&gt;</button>
      </div>
      {/* Add category UI */}
      <div className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="New Category Name"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          onClick={() => {
            if (!newCatName.trim()) return;
            const newCat: Category = { id: genId(), name: newCatName.trim() };
            const updated = [...categories, newCat];
            setCategories(updated);
            saveCategories(updated);
            setNewCatName('');
          }}
        >Add Category</button>
      </div>
      {/* Add budget UI */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <select
            className="border rounded px-2 py-1 flex-1"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.filter(cat => !budgets.some(b => b.categoryId === cat.id && (
              (b.recurring || (b.month && b.month === month)) || (b.month && b.month <= month && (!b.endMonth || b.endMonth >= month))
            ))).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="Amount ($)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            type="number"
            min="0"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs">Recurrence:</label>
            <select
              className="border rounded px-2 py-1"
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as any)}
            >
              <option value="this">This Month Only</option>
              <option value="recurring">Recurring</option>
              <option value="range">Start/End Month</option>
            </select>
          </div>
          {recurrence === 'range' && (
            <div className="flex gap-1 items-end">
              <div>
                <label className="text-xs">Start:</label>
                <input type="month" className="border rounded px-2 py-1" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
              </div>
              <div>
                <label className="text-xs">End:</label>
                <input type="month" className="border rounded px-2 py-1" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
              </div>
            </div>
          )}
          <button className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600" onClick={() => {
            if (!selectedCategory || !amount || isNaN(Number(amount))) return;
            let newBudget: Budget;
            if (recurrence === 'this') {
              newBudget = { id: genId(), categoryId: selectedCategory, amount: Number(amount), month };
            } else if (recurrence === 'recurring') {
              newBudget = { id: genId(), categoryId: selectedCategory, amount: Number(amount), recurring: true };
            } else {
              newBudget = { id: genId(), categoryId: selectedCategory, amount: Number(amount), month: rangeStart, endMonth: rangeEnd } as any;
            }
            const updated = [...budgets, newBudget];
            setBudgets(updated);
            saveBudgets(updated);
            setSelectedCategory('');
            setAmount('');
          }}>Add Budget</button>
        </div>
      </div>
      {/* List budgets for this month */}
      <ul className="divide-y mb-8">
        {budgets.map(budget => {
          const cat = categories.find(c => c.id === budget.categoryId);
          // Calculate spent for this budget in this month
          const spent = transactions
            .filter(tx => {
              const txMonth = tx.date.slice(0, 7);
              return (
                (tx.budgetId === budget.id || tx.category === cat?.name) &&
                txMonth === month
              );
            })
            .reduce((sum, tx) => sum + (tx.amount < 0 ? -tx.amount : 0), 0); // Only count expenses
          const remaining = budget.amount - spent;
          const percent = Math.min(1, spent / budget.amount);
          let barColor = 'bg-green-400';
          if (percent > 0.9) barColor = 'bg-red-500';
          else if (percent > 0.7) barColor = 'bg-yellow-400';
          return (
            <li key={budget.id} className="py-2 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="flex-1 font-medium">{cat ? cat.name : 'Uncategorized'}</span>
                {editingId === budget.id ? (
                  <>
                    <input
                      className="border rounded px-2 py-1 w-24"
                      type="number"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                    />
                    <button className="bg-blue-500 text-white px-2 py-1 rounded ml-1" onClick={() => handleEdit(budget.id)}>Save</button>
                    <button className="bg-gray-300 text-gray-700 px-2 py-1 rounded ml-1" onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="w-24">${budget.amount.toFixed(2)}</span>
                    <button className="text-blue-500 ml-2" onClick={() => { setEditingId(budget.id); setEditAmount(budget.amount.toString()); }}>Edit</button>
                    <button className="text-red-500 ml-2" onClick={() => handleDelete(budget.id)}>Delete</button>
                  </>
                )}
              </div>
              {/* Progress bar and remaining */}
              <div className="w-full h-3 bg-gray-200 rounded mt-1">
                <div
                  className={`h-3 rounded ${barColor}`}
                  style={{ width: `${percent * 100}%`, transition: 'width 0.4s' }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                <span>Spent: ${spent.toFixed(2)}</span>
                <span>Remaining: ${remaining.toFixed(2)} / ${budget.amount.toFixed(2)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {/* Debug section */}
      <div className="mt-8 p-2 bg-yellow-50 text-xs rounded">
        <div className="font-bold mb-1">Debug Info:</div>
        <div><b>Categories (from storage):</b> <pre>{JSON.stringify(categories, null, 2)}</pre></div>
        <div><b>Budgets (from storage):</b> <pre>{JSON.stringify(budgets, null, 2)}</pre></div>
      </div>
    </div>
  );
};

export default BudgetsTab;
