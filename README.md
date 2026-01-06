# Grain Flow - Intelligent Warehouse Management System 🏭

![Grain Flow Banner](/public/icon.svg)

**Grain Flow** is a professional-grade, multi-tenant Warehouse Management System (WMS) designed for agricultural storage. It replaces manual ledgers with a secure, real-time digital platform tracking stock, financials, and customer relationships.

Built with **Next.js 16**, **Supabase**, and **Shadcn UI**, it offers a modern, responsive experience with offline-first capabilities (PWA).

---

## 🚀 Key Features

### 📦 Smart Inventory & Logistics

- **Inflow/Outflow workflows**: Streamlined forms with validation logic (e.g., preventing withdrawal > stock).
- **Readable IDs**: Auto-generated transaction IDs (e.g., `REC-1001`, `PAY-505`) for easy reference.
- **Lot Management**: Track capacity by specific warehouse zones (Row A, Row B).
- **Visual Metrics**: Real-time charts for occupancy, weekly flow, and revenue.
- **SMS Notifications**: Automated SMS for inflow, outflow, and payment reminders via TextBee.

### 💰 Financial Automation

- **Auto-Billing**: Calculates rent based on storage duration (6-Month vs 1-Year cycles).
- **Hamali (Labor) Tracking**: Separate ledgers for labor charges vs rent.
- **Expense Manager**: Track operational costs (Staff, Utilities) to calculate net profit.
- **Debt Insights**: High-level dashboards showing "Total Warehouse Due" vs "Collected".

### 👥 Customer Portal & CRM

- **Customer Profiles**: 360-degree view of every client (Active Stock, History, Total Due).
- **Activity Timeline**: Full history of every inflow, payment, and withdrawal.
- **Smart Payment Recording**: Expandable record selection with readable IDs - see all customer records, select which one to pay.
- **One-Click Actions**: Quick buttons for "New Inflow" or "Receive Payment" directly from profile.

### 🔍 Search & Filter

- **Universal Search**: Instant search across all major pages (Customers, Payments, Storage, Outflow, Expenses, Inflow).
- **Advanced Filters**: Date range filtering, sort options, and multi-criteria search.
- **Smart Empty States**: Context-aware messages when no results found.
- **Client-Side Performance**: Instant filtering with no server round-trips for 100+ records.

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

Visit `http://localhost:3000`.

## 🧪 Testing & Security

Start the test suite with:

```bash
# Run Unit & Integration Tests (Vitest)
npm run test

# Run End-to-End Tests (Playwright)
npm run test:e2e

# Run Security Audit (Application Level)
npm run test:security

# Run RLS Penetration Testing (Requires local DB)
npm run security:verify-rls
```

All billing logic is regression-tested against 10+ critical scenarios including leap years and complex boundaries.

---

## 🔮 Roadmap / "Missing" Pro Features

While the application is production-ready, these features are continuously evolving:

- [x] **Role Based Access**: Implemented multi-tier roles (Super Admin, Owner, Admin, Manager, Staff, Customer).
- [x] **Mobile Optimization**: Full responsive overhaul + optimized dialog forms for phone usage.
- [x] **Audit Logging**: Comprehensive tracking of inflows and withdrawals.
- [x] **Automated Testing**: Integration tests (Playwright) & Unit tests (Vitest) for critical flows.
- [x] **PDF Generation**: Native export of Receipts and Reports via `jsPDF`.
- [x] **Search & Filter**: Universal search across all pages with date range filtering and sort options.
- [x] **Smart Payment UX**: Expandable record selection with readable IDs and per-record balance display.
- [ ] **WhatsApp Integration**: Automated payment reminders via WhatsApp Business API.
- [ ] **Digital Payments**: Razorpay integration for UPI/Card payments with auto-reconciliation.
- [ ] **Customer Self-Service**: OTP login portal for customers to view statements and upload payment proofs.
- [ ] **Email Notifications**: Automated payment reminders and receipts.

---

## 📄 License

Private Property of Grain Flow. Do not distribute.
