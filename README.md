# GymPay

A dashboard for personal trainers / fitness coaches to manage clients, invoices, expenses, goals, and their session calendar — all in one place.

## Features

- **Home** — revenue and pending-invoice totals (computed live from real invoice data), today's booked sessions, recent expenses
- **Clients** — add clients, see status at a glance
- **Client Goals** — set and track per-client fitness goals (strength, weight, distance, time, body %)
- **Invoices** — build an invoice against a real client, add/remove line items, auto-calculated subtotal/tax/total, send it
- **Expenses** — log expenses by category, filter the recent list
- **Calendar** — book sessions per client/day, see the day's schedule, cancel a session

All of the above share a single in-memory data store (`context/DataContext.tsx`), so actions in one part of the app (e.g. sending an invoice) are reflected everywhere else that depends on it (e.g. the Home dashboard's Pending total).

> **Note:** data currently lives in React state only and resets on page refresh — there's no backend or persistence layer yet (see Roadmap below).

## Tech Stack

- React 19 + TypeScript
- React Router (HashRouter)
- Vite
- Tailwind CSS (via CDN, configured in `index.html`)

## Run Locally

**Prerequisites:** Node.js (v18+)

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (defaults to `http://localhost:3000`).

To build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
App.tsx                 Route definitions and layout shell
index.tsx                Entry point, wraps the app in DataProvider + HashRouter
context/DataContext.tsx  Shared in-memory data store (clients, invoices, expenses, goals, sessions)
utils/format.ts          Currency formatting helpers
types.ts                 Shared TypeScript types
components/              Icon, BottomNav
pages/                   HomePage, ClientsPage, ClientGoalsPage, NewInvoicePage, ExpensesPage, CalendarPage, SettingsPage
```

## Roadmap / Known Gaps

- No persistence — data resets on refresh (would need `localStorage` or a real backend)
- No authentication
- Settings page is UI-only (not yet wired to real account/business settings)
- No recurring invoices or automated payment reminders
