# BagBill - Intelligent Warehouse Management System 🏭

![BagBill Banner](/public/icon.svg)

**BagBill** is a professional-grade, multi-tenant Warehouse Management System (WMS) designed for agricultural storage. It replaces manual ledgers with a secure, real-time digital platform tracking stock, financials, and customer relationships.

Built with **Next.js 16**, **Supabase**, and **Shadcn UI**, it offers a modern, responsive experience with offline-first capabilities (PWA).

---

## 🚀 Key Features

### 📦 Smart Inventory & Logistics

- **Inflow/Outflow workflows**: Streamlined forms with validation logic (e.g., preventing withdrawal > stock).
- **Readable IDs**: Auto-generated transaction IDs (e.g., `REC-1001`, `PAY-505`) for easy reference.
- **Lot Management**: Track capacity by specific warehouse zones (Row A, Row B).
- **Visual Metrics**: Real-time charts for occupancy, weekly flow, and revenue.

### 💰 Financial Automation

- **Auto-Billing**: Calculates rent based on storage duration (6-Month vs 1-Year cycles).
- **Hamali (Labor) Tracking**: Separate ledgers for labor charges vs rent.
- **Expense Manager**: Track operational costs (Staff, Utilities) to calculate net profit.
- **Debt Insights**: High-level dashboards showing "Total Warehouse Due" vs "Collected".

### 👥 Customer Portal & CRM

- **Customer Profiles**: 360-degree view of every client (Active Stock, History, Total Due).
- **Activity Timeline**: Full history of every inflow, payment, and withdrawal.
- **One-Click Actions**: Quick buttons for "New Inflow" or "Receive Payment" directly from profile.

### ⚙️ Professional Grade

- **Transactions Audit**: Dedicated `withdrawal_transactions` ledger tracks every partial or full withdrawal for 100% accountability.
- **Security**: Row Level Security (RLS) ensures data isolation between different warehouses.
- **Mobile First**: Optimized "App-like" feel with compact headers, touch-friendly forms, and responsive data cards.
- **Dark Mode**: Built-in high-contrast dark theme for low-light environments.

---

## 🛠️ Technology Stack

| Layer          | Technology                                         |
| :------------- | :------------------------------------------------- |
| **Framework**  | [Next.js 16 (App Router)](https://nextjs.org/)     |
| **Language**   | TypeScript                                         |
| **Database**   | [Supabase (PostgreSQL)](https://supabase.com/)     |
| **Auth**       | Supabase Auth (SSR)                                |
| **UI Library** | [Shadcn/UI](https://ui.shadcn.com/) + Tailwind CSS |
| **Monitoring** | Sentry (Error Tracking & Performance)              |
| **State**      | React Server Components (RSC) + Server Actions     |
| **Validation** | Zod                                                |

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase Project

### 1. Installation

```bash
git clone https://github.com/siva22101989/rent_supabase.git
cd rent_supabase
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SENTRY_AUTH_TOKEN=your_sentry_token (Optional)
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## 🔮 Roadmap / "Missing" Pro Features

While the application is production-ready, these features are continuously evolving:

- [x] **Role Based Access**: Implemented multi-tier roles (Super Admin, Owner, Admin, Manager, Staff, Customer).
- [x] **Mobile Optimization**: Full responsive overhaul + optimized dialog forms for phone usage.
- [x] **Audit Logging**: Comprehensive tracking of inflows and withdrawals.
- [x] **Automated Testing**: Integration tests (Playwright) & Unit tests (Vitest) for critical flows.
- [x] **PDF Generation**: Native export of Receipts and Reports via `jsPDF`.
- [ ] **Email Notifications**: Automated payment reminders and receipts.

---

## 📄 License

Private Property of BagBill. Do not distribute.
