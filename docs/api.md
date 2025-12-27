# Internal API Documentation (Server Actions)

This document describes the primary server actions used for data mutation and management in the Rent Management system.

## 👥 Customer Management

### `addCustomer`

Creates a new customer record.

- **Path:** `src/lib/actions/customers.ts`
- **Args:** `(prevState: FormState, formData: FormData)`
- **Validation:** Uses `CustomerSchema` (Zod).
- **Security:** Rate limited (5 req / 2 min).

### `updateCustomer`

Updates existing customer details.

- **Path:** `src/lib/actions/customers.ts`
- **Args:** `(id: string, prevState: FormState, formData: FormData)`

## 📦 Storage Operations

### `addInflow`

Processes a new storage record (Inflow).

- **Path:** `src/lib/actions/storage.ts`
- **Args:** `(prevState: InflowFormState, formData: FormData)`
- **Features:** Supports both 'Normal' and 'Plot' storage types.
- **Security:** Rate limited (10 req / 2 min).

### `addOutflow`

Records a withdrawal from storage.

- **Path:** `src/lib/actions/storage.ts`
- **Args:** `(prevState: OutflowFormState, formData: FormData)`
- **Logic:** Calculates final rent and updates storage balance.
- **Security:** Rate limited (10 req / 2 min).

## 💰 Financial Transactions

### `addPayment`

Records a rent payment or adds an extra hamali charge.

- **Path:** `src/lib/actions/financials.ts`
- **Args:** `(prevState: PaymentFormState, formData: FormData)`

### `addExpense`

Logs a warehouse operational expense.

- **Path:** `src/lib/actions/financials.ts`
- **Args:** `(prevState: FormState, formData: FormData)`

## 🏢 Warehouse & Access

### `createWarehouse`

Initializes a new warehouse for a user.

- **Path:** `src/lib/actions/warehouses.ts`
- **Args:** `(prevState: FormState, formData: FormData)`

### `inviteTeamMember`

Sends an invitation/link for a team member to join.

- **Path:** `src/lib/actions/warehouses.ts`
- **Args:** `(warehouseId: string, email: string, role: Role)`
