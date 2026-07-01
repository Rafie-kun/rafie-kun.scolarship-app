import React, { createContext, useContext, useState, useEffect } from 'react';
import { playClickSound } from '../utils/sound';

export type ThemeId = 'overworld' | 'nether' | 'end' | 'aether';
export type ThemeMode = 'light' | 'dark' | 'minecraft';
export type CurrencyId = 'USD' | 'EUR' | 'GBP' | 'BDT' | 'CAD' | 'AUD' | 'INR';

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: ThemeId;
  soundEnabled: boolean;
  textGlow: boolean;
  currency: CurrencyId;
  rates: Record<CurrencyId, number>;
  threeDActive: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setTheme: (theme: ThemeId) => void;
  toggleSound: () => void;
  toggleGlow: () => void;
  setCurrency: (currency: CurrencyId) => void;
  toggleThreeD: () => void;
  convertAmount: (amountUSD: number) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_RATES: Record<CurrencyId, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  BDT: 117.5,
  CAD: 1.37,
  AUD: 1.5,
  INR: 83.5
};

const CURRENCY_SYMBOLS: Record<CurrencyId, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BDT: '৳',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹'
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('scholarpath_theme_mode') as ThemeMode) || 'minecraft';
  });

  const [theme, setThemeState] = useState<ThemeId>(() => {
    return (localStorage.getItem('scholarpath_active_theme') as ThemeId) || 'overworld';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('scholarpath_sounds') !== 'false';
  });

  const [textGlow, setTextGlow] = useState<boolean>(() => {
    return localStorage.getItem('scholarpath_glow') !== 'false';
  });

  const [currency, setCurrencyState] = useState<CurrencyId>(() => {
    return (localStorage.getItem('scholarpath_currency') as CurrencyId) || 'USD';
  });

  const [rates, setRates] = useState<Record<CurrencyId, number>>(DEFAULT_RATES);

  const [threeDActive, setThreeDActive] = useState<boolean>(() => {
    return localStorage.getItem('scholarpath_3d') !== 'false';
  });

  // Fetch live exchange rates from open source repository
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates) {
            setRates({
              USD: 1.0,
              EUR: data.rates.EUR || DEFAULT_RATES.EUR,
              GBP: data.rates.GBP || DEFAULT_RATES.GBP,
              BDT: data.rates.BDT || DEFAULT_RATES.BDT,
              CAD: data.rates.CAD || DEFAULT_RATES.CAD,
              AUD: data.rates.AUD || DEFAULT_RATES.AUD,
              INR: data.rates.INR || DEFAULT_RATES.INR
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch active rates, utilizing offline backup matrices.", e);
      }
    }
    fetchRates();
  }, []);

  // Apply theme to HTML classList and set CSS variables on the root element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      'theme-overworld', 'theme-nether', 'theme-end', 'theme-aether',
      'theme-mode-modern', 'theme-mode-minecraft', 'theme-mode-light', 'theme-mode-dark'
    );
    root.classList.add(`theme-${theme}`);
    root.classList.add(`theme-mode-${themeMode}`);
    if (themeMode !== 'minecraft') {
      root.classList.add('theme-mode-modern');
    }

    // Set CSS custom properties on root dynamically based on themeMode
    if (themeMode === 'minecraft') {
      root.style.setProperty('--bg-primary', '#110f0d');
      root.style.setProperty('--bg-secondary', '#2c2927');
      root.style.setProperty('--bg-tertiary', '#141414');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#ffff55');
      root.style.setProperty('--text-tertiary', '#ffaa00');
      root.style.setProperty('--border-color', '#000000');
      root.style.setProperty('--border-style', '4px solid #000000');
      root.style.setProperty('--font-heading', '"Press Start 2P", monospace');
      root.style.setProperty('--font-body', '"JetBrains Mono", monospace');
      root.style.setProperty('--box-shadow', 'inset -4px -4px 0 #141414, inset 4px 4px 0 #555');
    } else if (themeMode === 'light') {
      root.style.setProperty('--bg-primary', '#fafafa');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-tertiary', '#64748b');
      root.style.setProperty('--border-color', '#cbd5e1');
      root.style.setProperty('--border-style', '2px solid #cbd5e1');
      root.style.setProperty('--font-heading', '"Inter", sans-serif');
      root.style.setProperty('--font-body', '"Inter", sans-serif');
      root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)');
    } else if (themeMode === 'dark') {
      root.style.setProperty('--bg-primary', '#0b0f19');
      root.style.setProperty('--bg-secondary', '#111827');
      root.style.setProperty('--bg-tertiary', '#1e293b');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--border-color', '#334155');
      root.style.setProperty('--border-style', '2px solid #334155');
      root.style.setProperty('--font-heading', '"Inter", sans-serif');
      root.style.setProperty('--font-body', '"Inter", sans-serif');
      root.style.setProperty('--box-shadow', '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -2px rgba(0,0,0,0.5)');
    }

    localStorage.setItem('scholarpath_active_theme', theme);
    localStorage.setItem('scholarpath_theme_mode', themeMode);
  }, [theme, themeMode]);

  const setThemeMode = (nextMode: ThemeMode) => {
    playClickSound();
    setThemeModeState(nextMode);
  };

  const setTheme = (nextTheme: ThemeId) => {
    playClickSound();
    setThemeState(nextTheme);
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('scholarpath_sounds', String(nextState));
    if (nextState) {
      playClickSound();
    }
  };

  const toggleGlow = () => {
    const nextState = !textGlow;
    setTextGlow(nextState);
    localStorage.setItem('scholarpath_glow', String(nextState));
    playClickSound();
  };

  const setCurrency = (nextCurr: CurrencyId) => {
    playClickSound();
    setCurrencyState(nextCurr);
    localStorage.setItem('scholarpath_currency', nextCurr);
  };

  const toggleThreeD = () => {
    const nextState = !threeDActive;
    setThreeDActive(nextState);
    localStorage.setItem('scholarpath_3d', String(nextState));
    playClickSound();
  };

  const convertAmount = (amountUSD: number): string => {
    const rate = rates[currency] || 1.0;
    const multiplied = Math.round(amountUSD * rate);
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    
    // Nice layout formatter (e.g. 15,200 € or ৳ 1,75,000)
    const formattedNum = multiplied.toLocaleString();
    if (currency === 'BDT') {
      return `${symbol} ${formattedNum}`;
    }
    return `${symbol}${formattedNum}`;
  };

  return (
    <ThemeContext.Provider value={{
      themeMode,
      theme,
      soundEnabled,
      textGlow,
      currency,
      rates,
      threeDActive,
      setThemeMode,
      setTheme,
      toggleSound,
      toggleGlow,
      setCurrency,
      toggleThreeD,
      convertAmount
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
