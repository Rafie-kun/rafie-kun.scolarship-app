import React, { useMemo } from 'react';
import { Plane, TrendingDown, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SEASONALITY: Record<string, number[]> = {
  // 0=Jan ... 11=Dec, 1.0 = cheapest, higher = more expensive
  Europe: [1.0, 1.0, 1.15, 1.25, 1.35, 1.6, 1.7, 1.6, 1.3, 1.15, 1.0, 1.45],
  'North America': [1.05, 1.0, 1.2, 1.3, 1.4, 1.65, 1.75, 1.65, 1.35, 1.2, 1.05, 1.5],
  Asia: [1.2, 1.1, 1.15, 1.25, 1.3, 1.5, 1.6, 1.55, 1.3, 1.2, 1.1, 1.35],
  Global: [1.1, 1.0, 1.15, 1.25, 1.35, 1.6, 1.65, 1.6, 1.3, 1.2, 1.05, 1.4],
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function regionForCountry(country: string): string {
  const lc = country.toLowerCase();
  if (['germany','france','united kingdom','uk','netherlands','poland','italy','spain','norway','switzerland'].some(k=>lc.includes(k))) return 'Europe';
  if (['united states','usa','canada'].some(k=>lc.includes(k))) return 'North America';
  if (['japan','china','india','bangladesh','malaysia','singapore','south korea','vietnam','indonesia','pakistan'].some(k=>lc.includes(k))) return 'Asia';
  return 'Global';
}

export default function FlightPriceWatcher({ country, basePriceUSD = 650 }: { country: string; basePriceUSD?: number }) {
  const { convertAmount } = useTheme();
  const region = regionForCountry(country);
  const multipliers = SEASONALITY[region] || SEASONALITY.Global;

  const rows = useMemo(() => MONTHS.map((m, i) => ({
    month: m,
    price: Math.round(basePriceUSD * multipliers[i]),
    mult: multipliers[i]
  })), [basePriceUSD, multipliers]);

  const cheapest = [...rows].sort((a,b)=>a.price-b.price).slice(0,3);
  const expensive = [...rows].sort((a,b)=>b.price-a.price).slice(0,2);

  return (
    <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
      <h4 className="font-press text-[9px] text-[#ffff55] uppercase flex items-center gap-2">
        <Plane className="w-4 h-4" /> Cheapest Months to Fly to {country || 'your destination'}
      </h4>
      <p className="text-[11px] font-mono text-stone-400">
        Estimates from historical seasonality for {region}. Base one-way economy from South Asia ≈ {convertAmount(basePriceUSD)}. Book 6-8 weeks ahead for the best fare.
      </p>

      <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
        {rows.map(r => {
          const h = Math.max(14, Math.round((1.8 - r.mult) * 70 + 14));
          const isCheap = cheapest.some(c=>c.month===r.month);
          return (
            <div key={r.month} className="flex flex-col items-center gap-1">
              <div className={`w-full border-2 flex items-end justify-center ${isCheap ? 'bg-[#55ff55] border-black' : 'bg-stone-700 border-black'}`} style={{ height: `${h}px` }}>
                <span className={`text-[8px] font-mono font-bold ${isCheap ? 'text-black' : 'text-stone-300'}`}>{convertAmount(r.price)}</span>
              </div>
              <span className={`text-[9px] font-mono ${isCheap ? 'text-[#55ff55] font-bold' : 'text-stone-400'}`}>{r.month}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-emerald-950/30 border border-[#55ff55]/30 p-2.5 flex items-start gap-2">
          <TrendingDown className="w-4 h-4 text-[#55ff55] shrink-0 mt-0.5" />
          <div>
            <span className="text-[#55ff55] font-bold uppercase text-[10px]">Cheapest</span>
            <p className="text-stone-200">{cheapest.map(c=>`${c.month} (${convertAmount(c.price)})`).join(', ')}</p>
          </div>
        </div>
        <div className="bg-red-950/30 border border-red-800/30 p-2.5 flex items-start gap-2">
          <Calendar className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-red-300 font-bold uppercase text-[10px]">Most Expensive</span>
            <p className="text-stone-300">{expensive.map(c=>`${c.month} (${convertAmount(c.price)})`).join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
