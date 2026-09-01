import React, { useState, useEffect } from 'react';
import { Home, Building2, Users, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { playClickSound } from '../utils/sound';

type CostEntry = {
  country: string;
  rentMonthly: number;
  foodMonthly: number;
  universities?: { name: string; tuition: number }[];
};

export default function HousingBoard({ country, universityName }: { country: string; universityName?: string }) {
  const { convertAmount } = useTheme();
  const [cost, setCost] = useState<CostEntry | null>(null);

  useEffect(() => {
    fetch('/data/cost_of_living.json').then(r=>r.ok?r.json():[]).then((data: CostEntry[])=>{
      const found = data.find(c=>c.country.toLowerCase()===country.toLowerCase());
      setCost(found || null);
    }).catch(()=>{});
  }, [country]);

  if (!cost) {
    return (
      <div className="bg-[#2c2c2c] border-4 border-black p-4 text-center">
        <p className="text-xs font-mono text-stone-400">Housing data for {country} is being added. Check back soon or ask the AI Advisor.</p>
      </div>
    );
  }

  const dormRent = Math.round(cost.rentMonthly * 0.6);
  const privateRent = cost.rentMonthly + 150;

  const listings = [
    { type: 'Dormitory', name: `${universityName || country} — Student Residence`, price: dormRent, perks: ['Furnished', 'Bills included', 'Apply via university housing portal'], color: 'emerald' },
    { type: 'Private Flat', name: `1-bed near ${universityName || 'campus'}`, price: privateRent, perks: ['Unfurnished typical', 'Utilities extra ~'+convertAmount(80), 'WG/shared flat cheaper'], color: 'amber' },
    { type: 'Shared Flat (WG)', name: `Room in shared flat`, price: Math.round(privateRent * 0.65), perks: ['Most common for internationals', 'Find via WG-Gesucht / HousingAnywhere'], color: 'sky' },
  ];

  return (
    <div className="space-y-3">
      <div className="bg-[#2c2c2c] border-4 border-black p-4">
        <h4 className="font-press text-[9px] text-[#ffff55] uppercase flex items-center gap-2">
          <Home className="w-4 h-4" /> Housing Near {universityName || country}
        </h4>
        <p className="text-[11px] font-mono text-stone-400 mt-1">Dorm is cheapest but limited — apply the day you get your admission letter. Private flats are faster but cost more.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {listings.map(l => (
          <div key={l.type} className={`p-3 border-4 bg-stone-900 flex flex-col gap-2 ${l.color==='emerald' ? 'border-[#55ff55]/40' : l.color==='amber' ? 'border-[#ffaa00]/40' : 'border-sky-700/40'}`}>
            <div className="flex items-center gap-2">
              {l.type==='Dormitory' ? <Building2 className="w-4 h-4 text-[#55ff55]" /> : l.type==='Private Flat' ? <Home className="w-4 h-4 text-[#ffaa00]" /> : <Users className="w-4 h-4 text-sky-400" />}
              <span className="font-bold text-stone-100 text-xs">{l.type}</span>
            </div>
            <span className="text-[11px] font-mono text-stone-400 line-clamp-1">{l.name}</span>
            <span className="font-press text-[12px] text-[#ffff55]">{convertAmount(l.price)}<span className="font-mono text-[10px] text-stone-400"> / mo</span></span>
            <ul className="text-[11px] font-mono text-stone-300 space-y-0.5">
              {l.perks.map(p=> <li key={p} className="flex gap-1.5"><span className="text-[#55ff55]">•</span>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-black/30 border-2 border-stone-800 p-3 flex flex-wrap gap-2 text-[11px] font-mono">
        <span className="text-stone-400">Find listings:</span>
        <a href={`https://www.google.com/search?q=${encodeURIComponent((universityName || country) + ' student housing dorm application')}`} target="_blank" rel="noopener noreferrer" className="text-[#55ffff] hover:underline flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> University housing portal
        </a>
        <span className="text-stone-600">·</span>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(country + ' WG shared flat student')}`} target="_blank" rel="noopener noreferrer" className="text-[#55ffff] hover:underline">WG / HousingAnywhere →</a>
      </div>
    </div>
  );
}
