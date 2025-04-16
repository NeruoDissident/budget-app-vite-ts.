import React, { useState, useMemo } from 'react';
import Calendar from './components/Calendar';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import { Transaction, RecurringTransaction, loadData, saveData, computeBalances, addRecurringInstances } from './data';
import { startOfToday } from 'date-fns';

export type SelectedDay = string | null;

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData('transactions'));
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>(() => loadData('recurrings'));
  const [selectedDay, setSelectedDay] = useState<SelectedDay>(startOfToday().toISOString().slice(0, 10));
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Expand recurring transactions into dated instances
  const allTransactions = useMemo(() => {
    return addRecurringInstances(transactions, recurrings);
  }, [transactions, recurrings]);

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
    <div className="flex min-h-screen">
      <Sidebar balances={balances} />
      <main className="flex-1 p-4">
        <Calendar
          year={new Date().getFullYear()}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          transactions={allTransactions}
        />
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Transactions for {selectedDay}</h2>
          <TransactionForm
            selectedDay={selectedDay}
            onAdd={handleAdd}
            onEdit={handleEdit}
            editingTx={editingTx}
            setEditingTx={setEditingTx}
          />
          <ul className="divide-y">
            {dayTxs.map(tx => (
              <li key={tx.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className={tx.amount >= 0 ? "text-green-600" : "text-red-600"}>{tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}</span>
                  <span className="ml-2">{tx.description}</span>
                </div>
                <div>
                  <button className="text-blue-500 mr-2" onClick={() => setEditingTx(tx)}>Edit</button>
                  <button className="text-red-500" onClick={() => handleDelete(tx.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Recurring Transactions</h2>
          <TransactionForm
            isRecurring
            onAddRecurring={handleAddRecurring}
            onEditRecurring={handleEditRecurring}
            editingRecurring={null}
            setEditingRecurring={() => {}}
          />
          <ul className="divide-y">
            {recurrings.map(rt => (
              <li key={rt.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className={rt.amount >= 0 ? "text-green-600" : "text-red-600"}>{rt.amount >= 0 ? '+' : ''}{rt.amount.toFixed(2)}</span>
                  <span className="ml-2">{rt.description}</span>
                  <span className="ml-2 text-xs text-gray-500">({rt.type} {rt.type === 'monthly' ? `on day ${rt.dayOfMonth}` : `every ${rt.dayOfWeek}`})</span>
                </div>
                <div>
                  <button className="text-red-500" onClick={() => handleDeleteRecurring(rt.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default App;
