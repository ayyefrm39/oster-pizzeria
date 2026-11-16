import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'oster_cart';
const TYPE_KEY = 'oster_order_type';

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [orderType, setOrderType] = useState(() => localStorage.getItem(TYPE_KEY) || 'pickup');

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(TYPE_KEY, orderType); }, [orderType]);

  const lineId = () => Math.random().toString(36).slice(2, 11);

  const addItem = useCallback((item) => {
    setItems(prev => [...prev, { ...item, lineId: lineId() }]);
  }, []);

  const updateQty = useCallback((lineId, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.lineId !== lineId));
    } else {
      setItems(prev => prev.map(i => i.lineId === lineId ? { ...i, qty } : i));
    }
  }, []);

  const removeItem = useCallback((lineId) => {
    setItems(prev => prev.filter(i => i.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, count, subtotal, orderType, setOrderType }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
