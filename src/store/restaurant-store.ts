"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, MenuItem } from "@/types";

type RestaurantState = {
  cart: CartItem[];
  lastOrderId: string | null;
  setLastOrderId: (orderId: string | null) => void;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  setCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      cart: [],
      lastOrderId: null,
      setLastOrderId: (orderId) => set({ lastOrderId: orderId }),
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((cartItem) => cartItem.menuItem.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((cartItem) =>
                cartItem.menuItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              )
            };
          }

          return { cart: [...state.cart, { menuItem: item, quantity: 1 }] };
        }),
      removeFromCart: (itemId) =>
        set((state) => ({
          cart: state.cart.filter((cartItem) => cartItem.menuItem.id !== itemId)
        })),
      setCartQuantity: (itemId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((cartItem) => cartItem.menuItem.id !== itemId)
              : state.cart.map((cartItem) =>
                  cartItem.menuItem.id === itemId ? { ...cartItem, quantity } : cartItem
                )
        })),
      clearCart: () => set({ cart: [] })
    }),
    {
      name: "nova-restaurant-ui"
    }
  )
);
