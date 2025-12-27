---
description: Protocol for implementing features that sync across Backend, Admin, and Storefront.
---

# Full-Stack Feature Workflow (Medusa v2)

**Goal:** Ensure every feature is managed in the Backend/Admin and reflected in the Storefront.

## Phase 1: Backend (The "Brain")

Define the data structure and business logic.

1.  **Identify Data Needs**: Does this need a new table (Module) or just extra fields (Metadata)?
    - _Complex Data_ (e.g., Wishlists, Reviews) -> **New Custom Module**.
    - _Simple Data_ (e.g., FAQs, Care Instructions) -> **Metadata** on existing entities (Product).
2.  **Implementation**:
    - **Module**: Create `src/modules/[name]`, define models, services, and run migrations.
    - **Metadata**: value is stored automatically; no schema change needed, but validation logic may be required in workflows.

## Phase 2: Admin (The "Control Panel")

Build the UI for operators to manage this new data.

1.  **Location**: Determine where the UI belongs (e.g., Product Details, Customer Details, or a new Sidebar Item).
2.  **Implementation**:
    - Create `src/admin/widgets/[name].tsx` or `src/admin/routes/[name]/page.tsx`.
    - Use `@medusajs/ui` for consistent design.
    - Use hooks like `useAdminUpdateProduct` to save data back to the API.

## Phase 3: API (The "Connector")

Ensure the Storefront can access the data.

1.  **Store API**:
    - If using **Metadata**, it's often available on the default `GET /store/products` endpoints.
    - If using a **Module**, create a custom API Route: `src/api/store/[name]/route.ts`.

## Phase 4: Storefront (The "Face")

Display the dynamic data to the customer.

1.  **Fetch**: Update fetching logic (Medusa SDK) to include new fields or call the new API route.
2.  **Render**: Replace hardcoded values with dynamic data.
3.  **Reflect**: Ensure UI updates (e.g., "Add to Wishlist") trigger API calls to persist changes.

---

## Example: converting "Product FAQ" to Full-Stack

1.  **Backend**: Decide to store FAQs in `product.metadata.faqs` (Array of objects).
2.  **Admin**: Create a Widget `ProductFAQWidget` in `src/admin/widgets/product-faq.tsx` that allows adding/removing questions for a specific product.
3.  **API**: No change needed; `metadata` is returned by default product endpoints.
4.  **Storefront**: Update `ProductFAQ` component to read `product.metadata.faqs`.
