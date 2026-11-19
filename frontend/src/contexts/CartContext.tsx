import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'cedar_hollow_pharmacy_cart';

function loadStoredItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        entry &&
        typeof entry === 'object' &&
        entry.product &&
        typeof entry.product.id === 'number' &&
        typeof entry.quantity === 'number' &&
        entry.quantity > 0
    );
  } catch {
    return [];
  }
}

function clampQuantity(product: Product, quantity: number): number {
  const whole = Math.max(0, Math.floor(quantity));
  const stock = Number(product.stock_quantity);
  if (Number.isFinite(stock) && stock >= 0) {
    return Math.min(whole, stock);
  }
  return whole;
}

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadStoredItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode); the cart still works in memory
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    // Prescription medicines are ordered from the prescription panel, never the cart.
    if (product.requires_prescription) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const next = clampQuantity(product, existing.quantity + quantity);
        if (next <= 0) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { product, quantity: next } : item
        );
      }
      const initial = clampQuantity(product, quantity);
      if (initial <= 0) return prev;
      return [...prev, { product, quantity: initial }];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        const next = clampQuantity(item.product, quantity);
        return next > 0 ? [{ ...item, quantity: next }] : [];
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextType>(
    () => ({ items, subtotal, itemCount, addItem, removeItem, updateQuantity, clearCart }),
    [items, subtotal, itemCount, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}