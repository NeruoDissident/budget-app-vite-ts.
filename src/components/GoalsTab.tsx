import React, { useState } from 'react';

export interface Goal {
  id: string;
  name: string;
  target: number;
  notes?: string;
}

interface GoalsTabProps {
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  projectedDates: Record<string, { optimistic: string | null; conservative: string | null }>;
  showConservativeDates?: boolean;
  totalRemainingBudgets?: number;
  monthsLeftInYear?: number;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ goals, onAddGoal, onEditGoal, onDeleteGoal, projectedDates, showConservativeDates, totalRemainingBudgets, monthsLeftInYear }) => {
  const [newGoal, setNewGoal] = useState<{ name: string; target: string; notes?: string }>({ name: '', target: '' });
  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Goals</h2>
      <form
        className="flex gap-2 mb-6"
        onSubmit={e => {
          e.preventDefault();
          if (!newGoal.name.trim() || !newGoal.target) return;
          onAddGoal({
            id: Date.now().toString(),
            name: newGoal.name,
            target: parseFloat(newGoal.target),
            notes: newGoal.notes,
          });
          setNewGoal({ name: '', target: '' });
        }}
      >
        <input
          className="border rounded px-2 py-1 flex-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
          placeholder="Goal name"
          value={newGoal.name}
          onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))}
        />
        <input
          className="border rounded px-2 py-1 w-28 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
          placeholder="Target ($)"
          type="number"
          min="1"
          value={newGoal.target}
          onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))}
        />
        <button className="bg-blue-500 text-white rounded px-4 py-1" type="submit">Add</button>
      </form>
      <ul className="space-y-4">
        {goals.map(goal => (
          <li key={goal.id} className="bg-white dark:bg-gray-800 rounded shadow p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-lg">{goal.name}</span>
                <span className="ml-2 text-gray-500">Target: ${goal.target.toLocaleString()}</span>
              </div>
              <button className="text-red-500" onClick={() => onDeleteGoal(goal.id)}>Delete</button>
            </div>
            {goal.notes && <div className="text-xs text-gray-400">{goal.notes}</div>}
            <div className="text-sm">
  <span className="font-semibold">Projected Date (after budgets): </span>
  {projectedDates[goal.id] && typeof projectedDates[goal.id] === 'object'
    ? (projectedDates[goal.id]?.conservative ?? 'Insufficient data')
    : 'Insufficient data'}
  {projectedDates[goal.id]
    && typeof projectedDates[goal.id] === 'object'
    && projectedDates[goal.id]?.optimistic
    && projectedDates[goal.id]?.optimistic !== projectedDates[goal.id]?.conservative && (
      <span className="block text-xs text-gray-400 mt-1">
        (If you save your entire net: {projectedDates[goal.id]?.optimistic})
      </span>
    )}
</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoalsTab;
