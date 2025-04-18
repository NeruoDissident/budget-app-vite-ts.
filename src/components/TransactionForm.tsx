import React, { useState } from 'react';
import { Transaction, RecurringTransaction, RecurrenceType, loadCategories, loadBudgets, saveCategories } from '../data';
import { v4 as uuidv4 } from 'uuid';

interface TransactionFormProps {
  selectedDay?: string | null;
  onAdd?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  editingTx?: Transaction | null;
  setEditingTx?: (tx: Transaction | null) => void;
  isRecurring?: boolean;
  onAddRecurring?: (rt: RecurringTransaction) => void;
  onEditRecurring?: (rt: RecurringTransaction) => void;
  editingRecurring?: RecurringTransaction | null;
  setEditingRecurring?: (rt: RecurringTransaction | null) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  selectedDay,
  onAdd,
  onEdit,
  editingTx,
  setEditingTx,
  isRecurring,
  onAddRecurring,
  onEditRecurring,
  editingRecurring,
  setEditingRecurring,
}) => {
  const [categories, setCategories] = React.useState(() => loadCategories());
  const [budgets, setBudgets] = React.useState(() => loadBudgets());
  const [category, setCategory] = React.useState<string>('');
  const [budgetId, setBudgetId] = React.useState<string>('');
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  React.useEffect(() => {
    setCategories(loadCategories());
    setBudgets(loadBudgets());
  }, []);

  React.useEffect(() => {
    if (editingTx) {
      setCategory(editingTx.category || '');
      setBudgetId(editingTx.budgetId || '');
    } else if (editingRecurring) {
      setCategory(editingRecurring.category || '');
      setBudgetId(editingRecurring.budgetId || '');
    } else {
      setCategory('');
      setBudgetId('');
    }
  }, [editingTx, editingRecurring]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  // Recurring fields
  const [type, setType] = useState<RecurrenceType>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startDate, setStartDate] = useState(selectedDay || '');
  const [endDate, setEndDate] = useState('');

  React.useEffect(() => {
    if (editingTx) {
      setDesc(editingTx.description);
      setAmount(editingTx.amount.toString());
    }
  }, [editingTx]);

  React.useEffect(() => {
    if (editingRecurring) {
      setDesc(editingRecurring.description);
      setAmount(editingRecurring.amount.toString());
      setType(editingRecurring.type);
      setDayOfMonth(editingRecurring.dayOfMonth || 1);
      setDayOfWeek(editingRecurring.dayOfWeek || 0);
      setStartDate(editingRecurring.startDate);
      setEndDate(editingRecurring.endDate || '');
    }
  }, [editingRecurring]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount || isNaN(Number(amount))) return;
    if (isRecurring) {
      const rt: RecurringTransaction = {
        id: editingRecurring ? editingRecurring.id : uuidv4(),
        description: desc,
        amount: Number(amount),
        type,
        dayOfMonth: type === 'monthly' ? dayOfMonth : undefined,
        dayOfWeek: type === 'biweekly' ? dayOfWeek : undefined,
        startDate,
        endDate: endDate || undefined,
        category: category || undefined,
        budgetId: budgetId || undefined,
      };
      if (editingRecurring && onEditRecurring) onEditRecurring(rt);
      else if (onAddRecurring) onAddRecurring(rt);
      setDesc(''); setAmount('');
      setStartDate(selectedDay || '');
      setEndDate('');
      setDayOfMonth(1);
      setDayOfWeek(0);
      setCategory('');
      setBudgetId('');
      if (setEditingRecurring) setEditingRecurring(null);
    } else {
      if (!selectedDay) return;
      const tx: Transaction = {
        id: editingTx ? editingTx.id : uuidv4(),
        date: selectedDay,
        description: desc,
        amount: Number(amount),
        category: category || undefined,
        budgetId: budgetId || undefined,
      };
      if (editingTx && onEdit) onEdit(tx);
      else if (onAdd) onAdd(tx);
      setDesc(''); setAmount('');
      setCategory('');
      setBudgetId('');
      if (setEditingTx) setEditingTx(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
      <input
        className="border rounded px-2 py-1 flex-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
        placeholder="Description"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        required
      />
      <input
        className="border rounded px-2 py-1 flex-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        type="number"
        step="0.01"
      />
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">Uncategorized</option>
          {categories.sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        {showAddCategory ? (
          <div className="mt-2 w-full">
            <input
              className="border rounded px-3 py-2 w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 text-base mb-2"
              placeholder="New category name"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 w-full">
              <button
                type="button"
                className="flex-1 px-2 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 text-base"
                onClick={() => {
                  const trimmed = newCategoryName.trim();
                  if (!trimmed) return;
                  // Prevent duplicates (case-insensitive)
                  if (categories.some(cat => cat.name.toLowerCase() === trimmed.toLowerCase())) {
                    setNewCategoryName('');
                    setShowAddCategory(false);
                    setCategory(trimmed);
                    return;
                  }
                  const newCat = { id: uuidv4(), name: trimmed };
                  const updated = [...categories, newCat];
                  setCategories(updated);
                  saveCategories(updated);
                  setCategory(trimmed);
                  setNewCategoryName('');
                  setShowAddCategory(false);
                }}
              >
                Save
              </button>
              <button
                type="button"
                className="flex-1 px-2 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 text-base"
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="mt-2 text-xs text-blue-500 hover:underline"
            onClick={() => setShowAddCategory(true)}
          >
            + Add Category
          </button>
        )}
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Budget (Weekly)</label>
        <select
          className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
          value={budgetId}
          onChange={e => setBudgetId(e.target.value)}
        >
          <option value="">None</option>
          {budgets.map(bud => (
            <option key={bud.id} value={bud.id}>
              {categories.find(cat => cat.id === bud.categoryId)?.name || 'Uncategorized'} (${`$${bud.amount.toFixed(2)}`}/week)
            </option>
          ))}
        </select>
      </div>
      {isRecurring ? (
        <>
          <select className="border rounded px-2 py-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400" value={type} onChange={e => setType(e.target.value as RecurrenceType)}>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
          </select>
          {type === 'monthly' && (
            <input
              className="border rounded px-2 py-1 w-16 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={e => setDayOfMonth(Number(e.target.value))}
              placeholder="Day"
            />
          )}
          {type === 'biweekly' && (
            <select className="border rounded px-2 py-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400" value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}>
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          )}
          <input
            className="border rounded px-2 py-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
          <input
            className="border rounded px-2 py-1 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            placeholder="End (optional)"
          />
        </>
      ) : null}
      <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white">
        {editingTx || editingRecurring ? 'Save' : 'Add'}
      </button>
      {(editingTx && setEditingTx) && (
        <button type="button" className="ml-2 text-gray-500" onClick={() => setEditingTx(null)}>Cancel</button>
      )}
      {(editingRecurring && setEditingRecurring) && (
        <button type="button" className="ml-2 text-gray-500" onClick={() => setEditingRecurring(null)}>Cancel</button>
      )}
    </form>
  );
};

export default TransactionForm;
