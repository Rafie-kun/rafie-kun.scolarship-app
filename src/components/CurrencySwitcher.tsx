import React, { useState } from 'react';
import { useTheme, CurrencyId } from '../context/ThemeContext';
import { Coins, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CURRENCY_LABELS: Record<CurrencyId, { name: string; flag: string; symbol: string }> = {
  USD: { name: 'United States Dollar', flag: '🇺🇸', symbol: '$' },
  GBP: { name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  EUR: { name: 'Euro', flag: '🇪🇺', symbol: '€' },
  BDT: { name: 'Bangladeshi Taka', flag: '🇧🇩', symbol: '৳' },
  CAD: { name: 'Canadian Dollar', flag: '🇨🇦', symbol: 'C$' },
  AUD: { name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$' },
  INR: { name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
  JPY: { name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥' },
  CHF: { name: 'Swiss Franc', flag: '🇨🇭', symbol: 'Fr' },
  SGD: { name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$' },
  MYR: { name: 'Malaysian Ringgit', flag: '🇲🇾', symbol: 'RM' },
  NZD: { name: 'New Zealand Dollar', flag: '🇳🇿', symbol: 'NZ$' },
  ZAR: { name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  BRL: { name: 'Brazilian Real', flag: '🇧🇷', symbol: 'R$' },
  MXN: { name: 'Mexican Peso', flag: '🇲🇽', symbol: '$' }
};

export default function CurrencySwitcher() {
  const { currency, setCurrency, themeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (id: CurrencyId) => {
    setCurrency(id);
    setIsOpen(false);
  };

  const isMinecraft = themeMode === 'minecraft';

  return (
    <div className="relative inline-block text-left" id="currency-switcher-root">
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        className={
          isMinecraft
            ? "mc-btn font-press text-[9px] py-2 px-3 flex items-center gap-1.5 min-w-[105px] justify-between uppercase"
            : "px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 text-xs font-medium flex items-center gap-2 justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
        }
      >
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 shrink-0" />
          <span>
            {CURRENCY_LABELS[currency].flag} {currency}
          </span>
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMinecraft ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMinecraft ? 0 : 5 }}
            transition={{ duration: 0.15 }}
            className={
              isMinecraft
                ? "absolute right-0 mt-2 w-72 bg-[#2a2421] border-4 border-black text-stone-200 font-mono z-[100] p-1.5 shadow-2xl [box-shadow:inset_-4px_-4px_0_#171412,inset_4px_4px_0_#433833]"
                : "absolute right-0 mt-2 w-72 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-2xl z-[100] py-1.5"
            }
          >
            {/* Currency Option List */}
            {(Object.keys(CURRENCY_LABELS) as CurrencyId[]).map((id) => {
              const selected = currency === id;
              const details = CURRENCY_LABELS[id];
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={
                    isMinecraft
                      ? `w-full text-left font-mono text-[10px] p-2 flex items-center justify-between uppercase cursor-pointer transition-all duration-100 ${
                          selected
                            ? 'bg-stone-950 text-[#ffff55] border-2 border-[#ffff55] font-bold [box-shadow:0_0_8px_rgba(255,255,85,0.4)]'
                            : 'hover:bg-stone-800 text-stone-300 hover:text-white'
                        }`
                      : `w-full text-left text-xs px-3 py-2 flex items-center justify-between cursor-pointer transition-all ${
                          selected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-l-4 border-indigo-500'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`
                  }
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base shrink-0">{details.flag}</span>
                    <span className="truncate">
                      <span className="font-bold">{id}</span>
                      <span className={isMinecraft ? "text-stone-400 font-sans" : "text-slate-400 font-normal"}>
                        {" — "}{details.name} ({details.symbol})
                      </span>
                    </span>
                  </span>
                  {selected && (
                    <Check className={isMinecraft ? "w-3 h-3 text-[#ffff55] shrink-0" : "w-3.5 h-3.5 text-indigo-500 shrink-0"} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
