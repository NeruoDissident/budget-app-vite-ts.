import React from 'react';

interface SidebarProps {
  balances: {
    today: number;
    week: number;
    month: number;
    year: number;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ balances }) => {
  return (
    <aside className="w-64 bg-white shadow-lg p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">Budget Calendar</h1>
      <div>
        <h2 className="text-lg font-semibold mb-2">Balances</h2>
        <ul className="space-y-2">
          <li>
            <span className="font-medium">Today:</span>
            <span className={balances.today >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {balances.today.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Week:</span>
            <span className={balances.week >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {balances.week.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Month:</span>
            <span className={balances.month >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {balances.month.toFixed(2)}
            </span>
          </li>
          <li>
            <span className="font-medium">End of Year:</span>
            <span className={balances.year >= 0 ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
              {balances.year.toFixed(2)}
            </span>
          </li>
        </ul>
      </div>
      <div className="mt-auto text-xs text-gray-400">
        All data is saved in your browser.
      </div>
    </aside>
  );
};

export default Sidebar;
