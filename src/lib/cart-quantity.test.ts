import { describe, expect, it } from "vitest";
import { getCartItemQuantity } from "./cart-quantity";
import type { CartItem, MenuItem } from "@/types";

const ribeye: MenuItem = {
  id: "ribeye",
  categoryId: "steaks",
  name: "Wagyu Ribeye",
  description: "12oz American wagyu",
  price: 68,
  imageUrl: "/ribeye.jpg",
  isAvailable: true,
  isFeatured: true,
  sortOrder: 1
};

describe("cart quantity helpers", () => {
  it("returns the current cart quantity for an item already in the cart", () => {
    const cart: CartItem[] = [{ menuItem: ribeye, quantity: 3 }];

    expect(getCartItemQuantity(cart, "ribeye")).toBe(3);
  });

  it("returns zero when an item is not in the cart", () => {
    const cart: CartItem[] = [{ menuItem: ribeye, quantity: 3 }];

    expect(getCartItemQuantity(cart, "filet")).toBe(0);
  });
});
