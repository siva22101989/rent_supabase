---
description: Analysis of current feature set against "Full-Stack" standards (Backend + Admin + Storefront).
---

# Full-Stack Compatibility Audit

**Summary:** Most recently added features (Phases 1-3) are **Client-Side Only**. To be "Full-Stack Compatible", they must be migrated to the Backend.

| Feature         | Current Implementation              | Full-Stack Status | Migration Plan (Proposed)                            |
| :-------------- | :---------------------------------- | :---------------- | :--------------------------------------------------- |
| **Promotions**  | `OfferSlider.tsx` (Hardcoded Array) | 🔴 Frontend Only  | Connect to Medusa Promotions Module (API).           |
| **Wishlist**    | `localStorage` (Browser only)       | 🟡 Client Side    | Create `Wishlist` Module in Backend + Customer Link. |
| **Product FAQ** | `ProductFAQ.tsx` (Hardcoded Array)  | 🔴 Frontend Only  | Add `metadata` to Product entity + Admin Widget.     |
| **Trust Bar**   | `TrustBar.tsx` (Static Text)        | 🔴 Frontend Only  | Store in a global "Content" Module or CMS.           |
| **Filters**     | `FilterSidebar` (URL Params)        | 🟢 Full Stack     | Already uses Backend Product Data (Price, Brand).    |
| **SEO**         | `StructuredData` (JSON-LD)          | 🟢 Full Stack     | Dynamically generates from Product Data.             |

---

# Migration Recommendation

To demonstrate the "Full-Stack" power, we should migrate the items that provide the most functional value first.

### 1. Wishlist (High Priority)

- **Why?** Users lose their wishlist if they switch devices.
- **Action:** Create a `Wishlist` Module in Medusa backend that links to `Customer`.

### 2. Product FAQ (Medium Priority)

- **Why?** Different medicines need different FAQs (e.g., "Side Effects" vs "Dosage").
- **Action:** Add an Admin Widget to manage FAQs per product.

### 3. Offers (Low Priority for now)

- **Why?** Medusa's existing Promotion module is complex; hardcoded offers are fine for MVP marketing.
- **Action:** Delay until advanced promotion rules are needed.
