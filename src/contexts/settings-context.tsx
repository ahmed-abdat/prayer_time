"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Settings } from "@/types/types";

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  calculationMethod: 2, // ISNA
  school: 0, // Shafi
  notifications: false,
  adhan: false,
  notificationTimes: {
    beforePrayer: 15,
    fajrNotification: true,
    dhuhrNotification: true,
    asrNotification: true,
    maghribNotification: true,
    ishaNotification: true,
  },
  adhanSettings: {
    volume: 50,
    muezzin: 'default',
    playAthan: true,
  }
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('prayerSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('prayerSettings', JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('prayerSettings', JSON.stringify(DEFAULT_SETTINGS));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 