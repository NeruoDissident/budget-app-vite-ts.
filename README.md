# Budget Calendar

A personal budgeting app with a calendar view, recurring transactions, and real-time balance calculations. Built with React, TypeScript, Vite, Tailwind CSS, and date-fns. All data is stored in localStorage.

## Features
- Calendar view for the current year
- Add, edit, delete transactions (income/spending)
- Add recurring monthly/biweekly transactions
- Real-time sidebar balances (today, week, month, year)
- All data in localStorage
- Modern UI with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start development server:**
   ```sh
   npm run dev
   ```
3. **Build for production:**
   ```sh
   npm run build
   ```
4. **Preview production build:**
   ```sh
   npm run preview
   ```

## Directory Structure

```
/src
  /components
    Calendar.tsx
    Sidebar.tsx
    TransactionForm.tsx
  App.tsx
  main.tsx
```

## How to Use

1. **Add Transactions:**
   - Click on any day in the calendar to view or add transactions for that date.
   - Use the sidebar to add income (positive amount) or expenses (negative amount).
   - Edit or delete existing transactions from the sidebar list.

2. **Recurring Transactions:**
   - Add recurring transactions (e.g., salary, rent) by selecting the recurring option when adding a transaction.
   - Recurring transactions will automatically appear on the correct days each month.

3. **View Balances:**
   - The sidebar shows your balances for today, this week, this month, and this year in real time.
   - The calendar shows your daily ending balance and highlights week/month end totals.
   - An orange "After Budget" row appears under week/month end balances to show your remaining balance after accounting for budgets.

4. **Budgets:**
   - Use the Budgets tab to set monthly budgets for different categories.
   - The "After Budget" amount reflects your remaining balance after all budgets are considered.

5. **Goals (Experimental):**
   - The Goals tab is an experimental feature for tracking savings goals. Currently, it supports only one goal at a time. More advanced goal tracking is planned for the future.

6. **Data Storage:**
   - All data is saved locally in your browser (localStorage). No account or server is required.

7. **Themes:**
   - The app supports multiple color themes, including dark, retro, and synthwave. Switch themes in your system or browser settings to see the effect.

## Notes
- This app is a work in progress. See the README for planned features and current limitations.
- If you encounter issues or have suggestions, feel free to open an issue or contribute!
- Supports multiple profiles. Must add at least one user in the "Users" tab for tabs to interact with eachother and save.

  index.css
```

---

No backend required. No service worker. No unnecessary dependencies.
