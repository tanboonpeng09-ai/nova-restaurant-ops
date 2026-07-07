# Implementation Specification: Menu V2 (Restaurant OS)

This document provides a comprehensive technical specification for implementing the **Menu V2** ordering experience. It expands upon the initial handoff blueprint to provide Codex with a clear, step-by-step implementation path.

---

## 1. Screen Layouts & Hierarchy

### 1.1 Mobile Layout (390px - Primary)

- **Sticky Header (Top):**
  - `TopAppBar`: Leading: Restaurant Logo/Name. Trailing: Table Number Chip.
- **Sticky Category Rail (Sub-header):**
  - `CategoryNavigation`: Horizontal scroll list of categories. Active category has an underline or high-contrast background.
- **Main Scroll Area:**
  - `FeaturedSection`: Horizontal carousel or large card for high-margin/popular items.
  - `CategorySection`: Labeled sections containing a vertical list of `ItemCard` (row variant).
- **Floating Bottom Bar:**
  - `StickyCartBar`: Visible when `items.length > 0`. Shows `[Count] View Order` and `[Total Price]`.

### 1.2 Desktop Layout (1280px+)

- **Three-Pane Dashboard:**
  - **Left Sidebar (280px):** `VerticalNavRail`. Persistent category list + Search.
  - **Center Panel (Main):** `MainProductGrid`. Responsive grid (3-4 columns) of `ItemCard` (standard vertical variant).
  - **Right Sidebar (320px):** `CartCommandCenter`. Persistent cart view with line items, subtotal, tax, and a "Send to Kitchen" primary action.

---

## 2. File & Component Structure (Next.js App Router)

```text
src/
|-- app/
|   `-- menu/
|       `-- page.tsx           # Main entry (Client Component)
|-- components/
|   |-- layout/
|   |   |-- TopAppBar.tsx
|   |   |-- CategoryNav.tsx
|   |   `-- CartSidebar.tsx    # Desktop-only
|   |-- menu/
|   |   |-- ItemCard.tsx       # Variants: standard, row, hero
|   |   |-- FeaturedSection.tsx
|   |   `-- CustomizationDrawer.tsx (Mobile) / SidePanel (Desktop)
|   `-- ui/
|       |-- Button.tsx
|       |-- Badge.tsx
|       `-- QuantitySelector.tsx
|-- store/
|   `-- useCartStore.ts        # Zustand
|-- types/
|   `-- menu.ts                # TypeScript interfaces
`-- lib/
    `-- supabase.ts            # Client initialization
```

---

## 3. Zustand Cart Store (`useCartStore.ts`)

```typescript
interface CartItem {
  cartId: string; // Unique ID for this specific customization combo
  productId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: {
    [optionGroupId: string]: string[]; // array of option IDs
  };
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  isDrawerOpen: boolean;
  selectedProduct: Product | null; // For customization flow

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  openCustomization: (product: Product) => void;
  closeCustomization: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}
```

---

## 4. Item Customization & Validation Logic

- **Schema Assumption:** Each product has an `option_groups` array. Each group has `min_selection` and `max_selection`.
- **Validation:**
  - Before "Add to Order" is active:
    - For every `option_group` where `min_selection > 0`, the `selectedOptions.length` must be `>= min_selection`.
  - If `max_selection === 1`, use **Radio Buttons**.
  - If `max_selection > 1`, use **Checkboxes**.
- **Visual Feedback:** Required sections that are not met should show a subtle "Required" tag in the UI, for example `text-error`.

---

## 5. Sticky Cart & Interaction Behavior

- **Trigger:** Adding the first item.
- **Mobile Animation:** Slide up from bottom with a `spring` transition.
- **Haptic Feedback:** The cart bar should "pulse" (`scale: 1.05`) briefly when a new item is added.
- **State Persistence:** Use `zustand/middleware` (`persist`) to keep the cart active if the user refreshes the page.

---

## 6. Supabase Data Assumptions

### `products` table

- `id`: uuid
- `name`: string
- `description`: text
- `price`: numeric
- `image_url`: string
- `category_id`: uuid
- `attributes`: jsonb, for example `{ "popular": true, "vegetarian": true, "sold_out": false }`
- `option_groups`: jsonb, structured as groups with options

### `categories` table

- `id`: uuid
- `name`: string
- `sort_order`: int

---

## 7. Edge Cases & Empty States

- **Sold Out:** Card is greyscale, "Sold Out" badge overlay, "Add" button replaced with "Out of Stock" disabled label.
- **Empty Cart:** On mobile, the cart bar is hidden. On desktop, the Right Sidebar shows a "Your tray is empty" illustration with a "Start adding items" call to action.
- **Search No Results:** Show a "No dishes found" message with a "Clear Filters" button.
- **Slow Connection:** Use **Skeleton Loaders** for the `ItemCard` grid.

---

## 8. Step-by-Step Implementation Plan

1. **Phase 1: Foundation.** Set up Next.js project, Tailwind config, and basic `Pro-Service` design tokens.
2. **Phase 2: Data & State.** Define TypeScript interfaces, implement the Zustand `useCartStore`, and set up the Supabase fetch logic for categories and products.
3. **Phase 3: Core UI (Mobile).** Build `ItemCard` (row variant), `TopAppBar`, and `CategoryNav`.
4. **Phase 4: Customization Flow.** Build the `CustomizationDrawer` with validation logic for required modifiers.
5. **Phase 5: Cart Entry.** Build the `StickyCartBar` with animations and quantity management.
6. **Phase 6: Desktop Adaptation.** Implement the three-pane layout and the `CartSidebar`.
7. **Phase 7: Refinement.** Add skeleton loaders, real-time "Sold Out" listeners via Supabase, and final polish on shadows/spacing.
