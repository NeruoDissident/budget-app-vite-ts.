import React from 'react';

import TransactionForm from './TransactionForm';
import { Transaction } from '../data';

interface SidebarProps {
  balances: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
  selectedDay: string | null;
  dayTxs: Transaction[];
  onAdd: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  editingTx: Transaction | null;
  setEditingTx: (tx: Transaction | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ balances, selectedDay, dayTxs, onAdd, onEdit, onDelete, editingTx, setEditingTx }) => {
  return (
    <aside className="w-64 bg-white dark:bg-gray-900 shadow-lg p-4 flex flex-col gap-4 border-r border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-400">Budget Calendar</h1>
      <div>
        <h2 className="text-lg font-semibold mb-2">Balances</h2>
        <ul className="space-y-2">
          <li>
            <span className="font-medium">Today:</span>
            <span className={balances.today >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              ${balances.today.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Week:</span>
            <span className={balances.week >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              ${balances.week.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Month:</span>
            <span className={balances.month >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              ${balances.month.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Year:</span>
            <span className={balances.year >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              ${balances.year.toFixed(2)}
            </span>
          </li>
        </ul>
      </div>
      {/* Transaction section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Transactions for {selectedDay}</h2>
        <TransactionForm
          selectedDay={selectedDay}
          onAdd={onAdd}
          onEdit={onEdit}
          editingTx={editingTx}
          setEditingTx={setEditingTx}
        />
        <ul className="mt-2 space-y-2">
          {dayTxs.map(tx => (
            <li key={tx.id} className="flex items-center justify-between text-sm">
              <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>${tx.amount.toFixed(2)}</span>
              <span className="ml-2 flex-1">{tx.description}</span>
              <button className="text-blue-500 ml-2" onClick={() => setEditingTx(tx)}>Edit</button>
              <button className="text-red-500 ml-2" onClick={() => onDelete(tx.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto text-xs text-gray-400">
        All data is saved in your browser.
      </div>
    </aside>
  );
};

export default Sidebar;
