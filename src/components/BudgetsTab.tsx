import React, { useState } from 'react';
import { Category, Budget, Transaction, loadCategories, saveCategories, loadBudgets, saveBudgets } from '../data';
import { v4 as uuidv4 } from 'uuid';

import { startOfWeek, endOfWeek, addWeeks, format, isWithinInterval, parseISO } from 'date-fns';

interface BudgetsTabProps {
  selectedDay: string;
  setSelectedDay: (d: string) => void;
  transactions: Transaction[];
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BudgetsTab: React.FC<BudgetsTabProps> = ({ selectedDay, setSelectedDay, transactions, onExport, onImport }) => {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
  const [newCat, setNewCat] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');
  const [budgetRecurrence, setBudgetRecurrence] = useState<'this' | 'future'>('this');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingBudget, setEditingBudget] = useState<{ id: string; amount: string } | null>(null);
  const [showAfterBudget, setShowAfterBudget] = useState(false);

  // Add category (with optional budget)
  const handleAddCategory = () => {
    if (!newCat.trim()) return;
    const cat: Category = { id: uuidv4(), name: newCat.trim() };
    const updatedCats = [...categories, cat];
    setCategories(updatedCats);
    saveCategories(updatedCats);
    // If budget entered, add it
    if (newCatBudget && !isNaN(Number(newCatBudget))) {
      const now = new Date(selectedDay);
      const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
      const newBudget: Budget = {
        id: uuidv4(),
        categoryId: cat.id,
        amount: Number(newCatBudget),
        month: budgetRecurrence === 'this' ? monthStr : undefined,
        recurring: budgetRecurrence === 'future',
      };
      const updatedBudgets = [...budgets, newBudget];
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
    }
    setNewCat('');
    setNewCatBudget('');
    setBudgetRecurrence('this');
  };


  // Edit category name
  const handleEditCategory = (id: string, name: string) => {
    const updated = categories.map(c => c.id === id ? { ...c, name } : c);
    setCategories(updated);
    saveCategories(updated);
    setEditingCat(null);
  };

  // Delete category
  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveCategories(updated);
    // Remove budget for this category
    const budg = budgets.filter(b => b.categoryId !== id);
    setBudgets(budg);
    saveBudgets(budg);
  };

  // Set budget for category
  const handleSetBudget = (categoryId: string, amount: string) => {
    if (!amount || isNaN(Number(amount))) return;
    const existing = budgets.find(b => b.categoryId === categoryId);
    let updated: Budget[];
    if (existing) {
      updated = budgets.map(b => b.categoryId === categoryId ? { ...b, amount: Number(amount) } : b);
    } else {
      updated = [...budgets, { id: uuidv4(), categoryId, amount: Number(amount) }];
    }
    setBudgets(updated);
    saveBudgets(updated);
    setEditingBudget(null);
  };

  // Determine week range based on selectedDay
  // Month navigation
  const now = new Date(selectedDay);
  const monthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const monthLabel = format(now, 'MMMM yyyy');
  const goPrevMonth = () => {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedDay(prev.toISOString().slice(0, 10));
  };
  const goNextMonth = () => {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setSelectedDay(next.toISOString().slice(0, 10));
  };

  // Calculate spent per budget for this month
  const spentByBudget: Record<string, number> = {};
  transactions.forEach(tx => {
    if (!tx.budgetId) return;
    const txDate = parseISO(tx.date);
    // Only count transactions in the same month
    if (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()) {
      spentByBudget[tx.budgetId] = (spentByBudget[tx.budgetId] || 0) + Math.abs(tx.amount);
    }
  });

  // Filter budgets for this month (recurring or explicit)
  const budgetsForMonth = budgets.filter(b => (b.month === monthStr) || (b.recurring && (!b.month || b.month <= monthStr)));

  // Calculate balances before/after budget
  const totalIncome = transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return tx.amount > 0 && txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  }).reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return tx.amount < 0 && txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  }).reduce((sum, tx) => sum + tx.amount, 0);
  const totalBudget = budgetsForMonth.reduce((sum, b) => sum + b.amount, 0);
  const balanceBeforeBudget = totalIncome + totalExpense;
  const balanceAfterBudget = balanceBeforeBudget - totalBudget;

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Budgets</h2>
      <div className="flex gap-2 mb-4">
        <button
          className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600"
          onClick={onExport}
        >Export Data</button>
        <label className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer">
          Import Data
          <input type="file" accept="application/json" className="hidden" onChange={onImport} />
        </label>
        <button
          className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600"
          onClick={() => {
            if (window.confirm('Are you sure you want to erase ALL data and reset the app? This cannot be undone.')) {
              localStorage.clear();
              alert('All data erased. The app will now reload.');
              window.location.reload();
            }
          }}
        >Reset All Data</button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={goPrevMonth}>&lt;</button>
        <span className="font-semibold">Month: {monthLabel}</span>
        <button className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={goNextMonth}>&gt;</button>
        <label className="flex items-center gap-2 ml-4">
          <input
            type="checkbox"
            checked={showAfterBudget}
            onChange={e => setShowAfterBudget(e.target.checked)}
          />
          <span className="text-xs">Show balances after budget</span>
        </label>
      </div>
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded shadow flex flex-col gap-2">
        <div>
          <span className="font-semibold">Balance ({showAfterBudget ? 'After Budget' : 'Before Budget'}): </span>
          <span className={showAfterBudget && balanceAfterBudget < 0 ? 'text-red-600' : 'text-green-600'}>
            ${showAfterBudget ? balanceAfterBudget.toFixed(2) : balanceBeforeBudget.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          <span>Total Income: ${totalIncome.toFixed(2)}</span> | <span>Total Expense: ${totalExpense.toFixed(2)}</span> | <span>Total Budget: ${totalBudget.toFixed(2)}</span>
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Categories</h3>
        <div className="flex gap-2 mb-2">
          <input
            className="border rounded px-2 py-1 flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100"
            placeholder="Add new category"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          />
          <input
            className="border rounded px-2 py-1 w-28 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100"
            placeholder="Budget ($)"
            value={newCatBudget}
            onChange={e => setNewCatBudget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            type="number"
            min="0"
          />
          <select
            className="border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100"
            value={budgetRecurrence}
            onChange={e => setBudgetRecurrence(e.target.value as 'this' | 'future')}
          >
            <option value="this">This month only</option>
            <option value="future">Every month going forward</option>
          </select>
          <button className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600" onClick={handleAddCategory}>Add</button>
        </div>
        <ul className="divide-y">
          {categories.map(cat => (
            <li key={cat.id} className="flex items-center justify-between py-2">
              {editingCat?.id === cat.id ? (
                <>
                  <input
                    className="border rounded px-2 py-1 flex-1 mr-2"
                    value={editingCat.name}
                    onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleEditCategory(cat.id, editingCat.name)}
                  />
                  <button className="text-blue-500 mr-2" onClick={() => handleEditCategory(cat.id, editingCat.name)}>Save</button>
                  <button className="text-gray-500" onClick={() => setEditingCat(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <div>
                    <button className="text-blue-500 mr-2" onClick={() => setEditingCat(cat)}>Edit</button>
                    <button className="text-red-500" onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Budgets (Monthly)</h3>
        <ul className="divide-y">
          {budgetsForMonth.map(bud => {
            const cat = categories.find(c => c.id === bud.categoryId);
            const spent = spentByBudget[bud.id] || 0;
            const remaining = bud.amount - spent;
            return (
              <li key={bud.id} className="py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{cat?.name || 'Uncategorized'}</span>
                  <span className="text-xs text-gray-500">Budget: ${`$${bud.amount.toFixed(2)}`}</span>
                  {bud.recurring ? <span className="ml-2 text-xs text-blue-500">Recurring</span> : bud.month ? <span className="ml-2 text-xs text-gray-400">{bud.month}</span> : null}
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Spent: <span className="font-semibold">${`$${spent.toFixed(2)}`}</span></span>
                  <span className="text-xs">Remaining: <span className={remaining < 0 ? 'text-red-600' : 'text-green-600'}>${`$${remaining.toFixed(2)}`}</span></span>
                </div>
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                  <div
                    className={`h-4 rounded transition-all duration-300 ${remaining < 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (spent / bud.amount) * 100)}%` }}
                  ></div>
                  {/* Overbudget indicator */}
                  {remaining < 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-red-700 bg-opacity-80">Over</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default BudgetsTab;
