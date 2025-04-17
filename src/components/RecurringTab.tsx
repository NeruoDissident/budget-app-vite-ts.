import React from 'react';
import { RecurringTransaction } from '../data';
import TransactionForm from './TransactionForm';

interface RecurringTabProps {
  recurrings: RecurringTransaction[];
  onAddRecurring: (rt: RecurringTransaction) => void;
  onEditRecurring: (rt: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  editingRecurring: RecurringTransaction | null;
  setEditingRecurring: (rt: RecurringTransaction | null) => void;
  selectedDay: string | null;
}

const RecurringTab: React.FC<RecurringTabProps> = ({
  recurrings,
  onAddRecurring,
  onEditRecurring,
  onDeleteRecurring,
  editingRecurring,
  setEditingRecurring,
  selectedDay,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Recurring Transactions</h2>
      <TransactionForm
        isRecurring
        selectedDay={selectedDay}
        onAddRecurring={onAddRecurring}
        onEditRecurring={onEditRecurring}
        editingRecurring={editingRecurring}
        setEditingRecurring={setEditingRecurring}
      />
      <ul className="divide-y mt-6">
        {recurrings.map(rt => (
          <li key={rt.id} className="py-2 flex justify-between items-center">
            <div>
              <span className={rt.amount >= 0 ? "text-green-600" : "text-red-600"}>{rt.amount >= 0 ? '+' : ''}${rt.amount.toFixed(2)}</span>
              <span className="ml-2">{rt.description}</span>
            </div>
            <div>
              <button className="text-blue-500 mr-2" onClick={() => setEditingRecurring(rt)}>Edit</button>
              <button className="text-red-500" onClick={() => onDeleteRecurring(rt.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecurringTab;
