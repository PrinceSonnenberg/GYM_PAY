# GymPay

A full-stack dashboard for personal trainers and fitness coaches to manage clients, invoices, expenses, goals, and session calendars with real-time database persistence.

## Features

- **Home Dashboard** — Revenue and pending-invoice totals (computed live from database invoice records), today's booked sessions, and recent expenses at a glance.
- **Client Management & Archiving** — Complete roster management with **Active** and **Archived** client views:
  - Add, edit, and view client details and invoice histories.
  - **Archive / Restore**: Safely archive inactive clients to keep your active roster clean while preserving historical records. Archived status persists reliably across sessions and reloads via Cloud SQL.
  - **Smart Dropdown Filtering**: Archived clients are automatically excluded from active dropdown selectors (e.g., creating new invoices or booking calendar sessions).
- **Client Goals** — Set and track per-client fitness goals (strength, weight, distance, time, body %).
- **Invoices** — Create invoices against active clients, manage line items with live subtotal/tax/total calculation, track payment status, and issue client receipts.
- **Expenses** — Log business expenses by category and filter logs.
- **Calendar** — Book and manage training sessions per client/day with real-time schedule tracking and session attendance checks.

Data is persisted across server restarts and browser reloads via a PostgreSQL database managed by Drizzle ORM and synced dynamically through `context/DataContext.tsx`.

## Tech Stack

- **Frontend**: React 18/19 + TypeScript, React Router, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Express.js server (`server.ts`) running Node.js with type-stripping
- **Database**: Cloud SQL (PostgreSQL) with Drizzle ORM and schema migrations
- **Authentication**: Firebase Auth with server-side token verification

## Run Locally

**Prerequisites:** Node.js (v18+)

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

To build for production:

```bash
npm run build
npm run start
```

## Project Structure

```
server.ts                Express API backend with Cloud SQL / Drizzle ORM integration
src/db/schema.ts         Drizzle ORM schema definitions (clients, invoices, expenses, goals, sessions)
App.tsx                  Route definitions and layout shell
context/DataContext.tsx   Shared data provider syncing state with backend API endpoints
types.ts                 Shared TypeScript interface definitions
components/              Reusable UI components (PageHeader, BottomNav, Icon, EmptyState, Modals)
pages/                   HomePage, ClientsPage, ClientGoalsPage, NewInvoicePage, ExpensesPage, CalendarPage, SettingsPage
```

## Features & Roadmap

- [x] Full Cloud SQL / PostgreSQL persistent backend for all records
- [x] Client archiving and restoration with active-only dropdown filtering
- [x] Firebase Authentication integration
- [x] Invoice generation, payment status management, and statistics
- [ ] Recurring invoices and automated payment reminders
- [ ] Export reports (PDF / CSV) for tax and accounting

