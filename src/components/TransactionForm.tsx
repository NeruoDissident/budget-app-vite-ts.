import React, { useState } from 'react';
import { Transaction, RecurringTransaction, RecurrenceType } from '../data';
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
      };
      if (editingRecurring && onEditRecurring) onEditRecurring(rt);
      else if (onAddRecurring) onAddRecurring(rt);
      setDesc(''); setAmount('');
      setStartDate(selectedDay || '');
      setEndDate('');
      setDayOfMonth(1);
      setDayOfWeek(0);
      if (setEditingRecurring) setEditingRecurring(null);
    } else {
      if (!selectedDay) return;
      const tx: Transaction = {
        id: editingTx ? editingTx.id : uuidv4(),
        date: selectedDay,
        description: desc,
        amount: Number(amount),
      };
      if (editingTx && onEdit) onEdit(tx);
      else if (onAdd) onAdd(tx);
      setDesc(''); setAmount('');
      if (setEditingTx) setEditingTx(null);
    }
  };

  return (
    <form className="flex flex-wrap gap-2 mb-4 items-end" onSubmit={handleSubmit}>
      <input
        className="border rounded px-2 py-1 flex-1"
        placeholder="Description"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        required
      />
      <input
        className="border rounded px-2 py-1 w-28"
        placeholder="Amount"
        type="number"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        required
      />
      {isRecurring ? (
        <>
          <select className="border rounded px-2 py-1" value={type} onChange={e => setType(e.target.value as RecurrenceType)}>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
          </select>
          {type === 'monthly' && (
            <input
              className="border rounded px-2 py-1 w-20"
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={e => setDayOfMonth(Number(e.target.value))}
              placeholder="Day"
              required
            />
          )}
          {type === 'biweekly' && (
            <select className="border rounded px-2 py-1" value={dayOfWeek} onChange={e => setDayOfWeek(Number(e.target.value))}>
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
            className="border rounded px-2 py-1"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
          <input
            className="border rounded px-2 py-1"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            placeholder="End (optional)"
          />
        </>
      ) : null}
      <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600">
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
