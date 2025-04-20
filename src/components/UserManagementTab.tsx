import React, { useState } from 'react';

export interface User {
  id: string;
  name: string;
}

interface UserManagementTabProps {
  users: User[];
  currentUserId: string;
  onCreateUser: (name: string) => void;
  onSwitchUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ users, currentUserId, onCreateUser, onSwitchUser, onDeleteUser }) => {
  const [newUserName, setNewUserName] = useState('');
  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 dark:text-blue-400">User Management</h2>
      <div className="mb-6">
        <input
          className="border rounded px-3 py-2 mr-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100"
          placeholder="New user name"
          value={newUserName}
          onChange={e => setNewUserName(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            if (newUserName.trim()) {
              onCreateUser(newUserName.trim());
              setNewUserName('');
            }
          }}
        >
          Create User
        </button>
      </div>
      <div className="flex gap-4 mb-6">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => {
            // Gather all relevant localStorage keys
            const backup: any = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (!key) continue;
              if (
                key === 'budget-calendar-users' ||
                key === 'budget-calendar-current-user' ||
                key.startsWith('budget-calendar-user-')
              ) {
                backup[key] = localStorage.getItem(key);
              }
            }
            // Download as JSON
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `budget-calendar-full-backup-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          }}
        >
          Save Backup (All Users)
        </button>
        <label className="bg-blue-700 text-white px-4 py-2 rounded cursor-pointer">
          Restore Backup
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const data = JSON.parse(text);
                // Validate keys
                if (!data['budget-calendar-users'] || !data['budget-calendar-current-user']) {
                  alert('Invalid backup file.');
                  return;
                }
                // Restore all relevant keys
                for (const [key, value] of Object.entries(data)) {
                  if (typeof value === 'string') {
                    localStorage.setItem(key, value);
                  }
                }
                alert('Backup restored! Reloading...');
                window.location.reload();
              } catch {
                alert('Invalid backup file.');
              }
            }}
          />
        </label>
      </div>
      <h3 className="font-semibold mb-2">Users</h3>
      <ul className="mb-4 divide-y">
        {users.map(user => (
          <li key={user.id} className="flex items-center justify-between py-2">
            <span className={user.id === currentUserId ? 'font-bold text-green-600 dark:text-green-400' : ''}>{user.name}</span>
            <div>
              {user.id !== currentUserId && (
                <button
                  className="text-blue-500 mr-2"
                  onClick={() => onSwitchUser(user.id)}
                >
                  Switch
                </button>
              )}
              <button
                className="text-red-500"
                onClick={() => onDeleteUser(user.id)}
                disabled={user.id === currentUserId}
                title={user.id === currentUserId ? 'Cannot delete active user' : 'Delete user'}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-400">Each user has their own budget, transactions, and settings. Data is stored locally in your browser only.</div>
    </div>
  );
};

export default UserManagementTab;
