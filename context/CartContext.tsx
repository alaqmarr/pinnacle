"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number; // in USD cents
  image?: string;
  sku?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number; // in USD cents
  isCartOpen: boolean;
  isHydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      image?: string | null;
      sku?: string | null;
    },
    quantity?: number
  ) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
}

const CART_STORAGE_KEY = "pinnacle_cart_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial client-side hydration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.error("[Cart] Failed to restore cart from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Persist items to localStorage whenever they change (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("[Cart] Failed to persist cart to localStorage:", e);
    }
  }, [items, isHydrated]);

  // 3. Listen to storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } catch (err) {
          console.error("[Cart] Storage sync error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addToCart = useCallback(
    (
      product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        image?: string | null;
        sku?: string | null;
      },
      quantity: number = 1
    ) => {
      if (quantity <= 0) return;
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.productId === product.id
        );
        if (existingIndex > -1) {
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        } else {
          return [
            ...prevItems,
            {
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.image || undefined,
              sku: product.sku || undefined,
              quantity,
            },
          ];
        }
      });
      // setIsCartOpen(true); // Don't auto-open
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (e) {
        console.error("[Cart] Clear cart localStorage error:", e);
      }
    }
  }, []);

  // 4. Server migration function: pushes localStorage items to /api/cart/migrate
  const syncWithServer = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const res = await fetch("/api/cart/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        console.log("[Cart] Cart migrated to server session successfully.");
      }
    } catch (err) {
      console.warn("[Cart] Cart migration API failed:", err);
    }
  }, [items]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isCartOpen,
        isHydrated,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
