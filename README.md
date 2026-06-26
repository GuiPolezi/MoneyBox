# 💰 Caixa

> ### Your finances in a single number.

A web app for personal finance built to **retire the spreadsheet**: log a transaction once and instantly see your balance, the month's net result and next month's forecast — all in a visual dashboard with _big numbers_, charts and predictability.

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3FCF8E?logo=supabase&logoColor=white&style=for-the-badge)

![Status](https://img.shields.io/badge/status-in%20development-0B3D2E?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-0B3D2E?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-welcome-0E7C5A?style=flat-square)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

**Caixa** drops the multi-spreadsheet model (fixed expenses, fixed income, debts) in favor of a **single transaction model** with a smart form. Everything is one entry — what changes are the _flags_.

### 🔐 Authentication & security

- Real sign up and login powered by **Supabase Auth**.
- Each user's data is **isolated at the database level** via _Row Level Security_ — no one sees anyone else's finances.

### 📊 Strategic dashboard

- **Big numbers**: current balance, income, expenses and the month's net result.
- **Charts**: spending-by-category pie and a 6-month history (income × expenses).
- **Automatic forecast** for the upcoming month, summing recurring entries, future installments and scheduled bills — no projection spreadsheet needed.

### ⚡ Single, dynamic entry

- An always-available button to record a transaction in seconds.
- The form adapts to the type: **Income · Expense · Transfer · Investment**.
- Flags: **Recurring** (repeats every month), **Pending** (doesn't affect the balance until paid) and **Installment** (auto-generates future installments, e.g. 1/12).
- Edit, delete or reverse any entry from the list.

### 🗂️ Organization

- **Categories** with colors that feed the charts.
- **Accounts & wallets** (banks, cash, etc.) with individual balances.
- **Budgets** with a monthly cap per category and a progress bar.
- **Goals / pots** with a target amount and deposit/withdraw.

### 📈 Investments

- Entries with an **expected yield rate** and **maturity date**, projecting the future value via compound interest.

### 🎨 Experience

- **Dark mode** with instant switching and no _flash_ on load.
- **Responsive**: sidebar on desktop, hamburger menu with a _drawer_ on mobile.
- Global month selector and number-first typography (tabular figures).

---

## Screenshots

Save your images under the `docs/` folder and reference them here. Example with two screens side by side:

```markdown
| Light theme | Dark theme |
| :---: | :---: |
| ![Dashboard light](docs/dashboard-light.png) | ![Dashboard dark](docs/dashboard-dark.png) |
```

---

## Tech Stack

| Layer | Stack |
| --- | --- |
| **Front-end** | React 18 + Vite |
| **Styling** | Tailwind CSS (color tokens via CSS variables) |
| **State** | Zustand |
| **Routing** | React Router |
| **Charts** | Recharts |
| **Icons** | Lucide |
| **Back-end** | Supabase (Auth + PostgreSQL + RLS) |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/YOUR-USERNAME/caixa.git
cd caixa
npm install
```

### 2. Set up Supabase

1. Create a new project on Supabase.
2. In the **SQL Editor**, paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This creates the tables with **Row Level Security** already enabled.
3. In **Project Settings → API**, copy the _Project URL_ and the _anon public key_.
4. _(Recommended in dev)_ In **Authentication → Email**, turn off **"Confirm email"** to sign in right after registering.

### 3. Environment variables

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run

```bash
npm run dev       # development server
npm run build     # production build
npm run preview   # preview the build
```

Open the URL printed by Vite, create your account and start logging. A new account starts empty — go to **Settings → "Restaurar exemplo"** to populate it with demo data.

> The app's interface is in Brazilian Portuguese and uses BRL (R$) formatting.

---

## Project Structure

```
caixa/
├─ src/
│  ├─ lib/
│  │  ├─ supabase.js     # Supabase client (reads .env)
│  │  ├─ store.js        # THE single data layer: auth + database access
│  │  ├─ finance.js      # pure calculations (balances, summaries, forecast)
│  │  ├─ theme.js        # theme preference (light/dark)
│  │  ├─ format.js       # BRL currency, dates, helpers
│  │  └─ seed.js         # sample data
│  ├─ components/        # BigNumber, Progress, Empty, TxRow…
│  ├─ pages/             # Dashboard, Transactions, Accounts, Budgets, Goals, Investments, Settings
│  ├─ TransactionModal.jsx   # dynamic form
│  ├─ Layout.jsx · Login.jsx · App.jsx · ui.jsx
│  └─ index.css
├─ supabase/
│  └─ schema.sql         # tables + RLS
└─ index.html
```

---

## Architecture

Two decisions keep the system easy to evolve:

- **One JSON document per row.** Each record is stored as `{ id, user_id, data }`, mirroring the object used in the app. All logic (balances, forecasts, charts) runs on the client in `finance.js` — no column mapping and no migration for every new field.
- **Single data layer.** All database access is concentrated in `store.js`. Screens call actions with stable names (`addTransaction`, `addBudget`…), so swapping the data source never touches the UI.

**Per-user isolation** happens in the database: RLS policies enforce `auth.uid() = user_id` on every read and write.

---

## Roadmap

Next steps drawn from a _benchmark_ against Mobills, Organizze, Monarch, Copilot and YNAB:

- [ ] 📥 Import / export **CSV** (migrate your current spreadsheet)
- [ ] 📈 **Net worth** over time
- [ ] 💳 **Credit card / statement** (accrual × cash basis)
- [ ] 🔔 **Bill reminders** + due-date calendar
- [ ] 🏷️ **Tags** and subcategories
- [ ] 🔁 **Recurrence engine** with frequency and end date
- [ ] 📊 **Reports** and trends section
- [ ] 📱 Installable **PWA** with biometric lock
- [x] 🌙 **Dark mode**
- [x] 🔐 Real authentication with per-user isolation

---

## License

Released under the **MIT** license. Feel free to use, modify and share. _(Remember to add a `LICENSE` file to the repository.)_

---

Made with ☕ and a bit of financial discipline. If this project helped you, leave a ⭐ on the repo.