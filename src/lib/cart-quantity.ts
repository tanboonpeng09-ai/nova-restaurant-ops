import type { CartItem } from "@/types";

export function getCartItemQuantity(cart: CartItem[], itemId: string) {
  return cart.find((cartItem) => cartItem.menuItem.id === itemId)?.quantity ?? 0;
}
