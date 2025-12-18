# Customer Portal Architecture

## Goal

Enable end-customers (farmers) to log in and view their stock across MULTIPLE warehouses.

## The Challenge

Currently, `auth.users` are treated as Warehouse Admins. `customers` are just passive data rows inside a warehouse.

## The Solution: "Identity Linking"

We will link a single `auth.user` to multiple `customers` rows.

### 1. Database Changes

- **Table**: `customers`
- **New Column**: `linked_user_id` (UUID, References `auth.users`).
- **Constraint**: None (One user can be linked to many customer rows).

### 2. Logic Flow

1.  **Registration**:

    - A Farmer signs up (or is invited).
    - We link their Identity (User ID) to their existing Customer Records in the DB (matching by Phone? Or manual "Invite Link"?).
    - _MVP Approach_: Manual Link by Admin or matching Phone Number during seeding/setup.

2.  **Data Fetching (`getPortfolio`)**:
    - Input: `auth.uid()`
    - Query:
      1. Find all `customer_ids` where `linked_user_id == auth.uid()`.
      2. Fetch `storage_records` and `warehouses` for these customers.
    - Output: Aggregated view.

### 3. UI Structure (`/portal`)

- **Separate Layout**: Different navigation (no "Inflow/Outflow" buttons, only "View").
- **Dashboard**:
  - "Total Stock Verified": 500 Bags.
  - "Warehouses": List of Warehouses holding stock.
- **Stock Page**:
  - Detailed table of specific lots/bags.

## Implementation Steps

1.  [Schema] Add `linked_user_id` to `customers`.
2.  [Schema] RLS: Allow Users to `SELECT` `customers` and `storage_records` where `linked_user_id` matches.
3.  [Query] Create `getCustomerPortfolio()`.
4.  [UI] Create `/portal/page.tsx`.
