import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';

const SettingsContext = createContext(/** @type {any} */ (null));

const DEFAULT_SETTINGS = {
  id: '',
  restaurantName: 'Öster Pizzeria',
  address: 'Södergatan 20, 241 30 Eslöv',
  phone: '076-963 62 22',
  openingHours: [
    { day: 1, open: '10:00', close: '20:00', closesNextDay: false },
    { day: 2, open: '10:00', close: '20:00', closesNextDay: false },
    { day: 3, open: '10:00', close: '20:00', closesNextDay: false },
    { day: 4, open: '10:00', close: '20:00', closesNextDay: false },
    { day: 5, open: '10:00', close: '02:00', closesNextDay: true },
    { day: 6, open: '10:00', close: '02:00', closesNextDay: true },
    { day: 0, open: '10:00', close: '22:00', closesNextDay: false }
  ],
  deliveryEnabled: true, pickupEnabled: true,
  deliveryFee: 39, minDeliveryOrder: 150, freeDeliveryThreshold: 400,
  estimatedPrepTime: 25, acceptPreOrders: false, ordersPaused: false,
  deliveryAreas: 'Hela Eslövs kommun'
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await api.entities.RestaurantSettings.list();
      if (list && list.length) {
        setSettings({ ...DEFAULT_SETTINGS, ...list[0], id: list[0].id });
      }
    } catch (e) {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
