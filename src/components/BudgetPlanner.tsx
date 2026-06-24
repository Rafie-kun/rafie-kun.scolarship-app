import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Briefcase, Sparkles, DollarSign, Home, Utensils, Bus, Shield, Wifi } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface CostData {
  country: string;
  currency: string;
  tuitionPublic: number;
  tuitionPrivate: number;
  rentMonthly: number;
  foodMonthly: number;
  transportMonthly: number;
  healthInsuranceMonthly: number;
  miscMonthly: number;
  hourlyWage: number;
  workHoursPerWeek: number;
  universities: { name: string; tuition: number }[];
}

export default function BudgetPlanner() {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [budgetData, setBudgetData] = useState<any>(null);
  const [aiTips, setAiTips] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);

  useEffect(() => {
    fetch('/data/cost_of_living.json')
      .then(res => res.json())
      .then(setCostData)
      .catch(() => {
        // Fallback data
        setCostData([
          {
            country: 'Germany',
            currency: 'EUR',
            tuitionPublic: 1500,
            tuitionPrivate: 12000,
            rentMonthly: 400,
            foodMonthly: 250,
            transportMonthly: 100,
            healthInsuranceMonthly: 120,
            miscMonthly: 200,
            hourlyWage: 12,
            workHoursPerWeek: 20,
            universities: [{ name: 'Technical University of Munich', tuition: 1500 }]
          }
        ]);
      });
  }, []);

  const calculateBudget = () => {
    if (!selectedCountry || !selectedUniversity) return;

    const country = costData.find(c => c.country === selectedCountry);
    if (!country) return;

    const uni = country.universities.find(u => u.name === selectedUniversity);
    if (!uni) return;

    const tuition = uni.tuition || country.tuitionPublic;
    const livingMonthly = country.rentMonthly + country.foodMonthly + country.transportMonthly + country.healthInsuranceMonthly + country.miscMonthly;
    const livingYearly = livingMonthly * 12;
    const totalCost = tuition + livingYearly;

    const monthlyEarnings = country.hourlyWage * country.workHoursPerWeek * 4;
    const yearlyEarnings = monthlyEarnings * 12;
    const netCost = totalCost - yearlyEarnings;

    setBudgetData({
      country: country.country,
      currency: country.currency,
      tuition,
      livingMonthly,
      livingYearly,
      totalCost,
      monthlyEarnings,
      yearlyEarnings,
      netCost,
      breakdown: {
        rent: country.rentMonthly,
        food: country.foodMonthly,
        transport: country.transportMonthly,
        health: country.healthInsuranceMonthly,
        misc: country.miscMonthly,
        hourlyWage: country.hourlyWage,
        workHours: country.workHoursPerWeek
      }
    });

    // Get AI tips
    fetchAITips(country, uni, totalCost, yearlyEarnings, netCost);
  };

  const fetchAITips = async (country: CostData, uni: any, totalCost: number, yearlyEarnings: number, netCost: number) => {
    setTipsLoading(true);
    try {
      const res = await fetch('/api/gemini/budget-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: country.country,
          university: uni.name,
          totalCost,
          yearlyEarnings,
          netCost,
          currency: country.currency,
          hourlyWage: country.hourlyWage,
          workHours: country.workHoursPerWeek
        })
      });
      const data = await res.json();
      setAiTips(data.tips || 'No tips available. Try again later.');
    } catch (err) {
      setAiTips('Unable to fetch AI tips. Please check your connection.');
    } finally {
      setTipsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1512] rounded-2xl p-6 border border-[#2c2c2c] shadow-xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-[#f5c842]" /> Budget Planner
        </h2>
        <p className="text-white/60 text-sm">Plan your study abroad budget and discover part‑time work opportunities.</p>
      </div>

      {/* Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/80 block mb-1">Target Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => { setSelectedCountry(e.target.value); setSelectedUniversity(''); setBudgetData(null); }}
            className="w-full bg-[#1a1512] border border-[#2c2c2c] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]"
          >
            <option value="">Select country...</option>
            {costData.map(c => (
              <option key={c.country} value={c.country}>{c.country}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/80 block mb-1">Target University</label>
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            className="w-full bg-[#1a1512] border border-[#2c2c2c] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f5c842]"
            disabled={!selectedCountry}
          >
            <option value="">Select university...</option>
            {costData.find(c => c.country === selectedCountry)?.universities.map(u => (
              <option key={u.name} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={calculateBudget}
        disabled={!selectedCountry || !selectedUniversity}
        className="w-full py-3 bg-gradient-to-r from-[#f5c842] to-[#ff8c42] text-[#0f2b5b] font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Calculate Budget
      </button>

      {/* Results */}
      {budgetData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a1512] border border-[#2c2c2c] rounded-2xl p-4 text-center">
              <p className="text-white/60 text-sm">Total Yearly Cost</p>
              <p className="text-2xl font-bold text-white">{budgetData.currency} {budgetData.totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1512] border border-[#2c2c2c] rounded-2xl p-4 text-center">
              <p className="text-white/60 text-sm">Part‑Time Earnings</p>
              <p className="text-2xl font-bold text-[#2ecc71]">+ {budgetData.currency} {budgetData.yearlyEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1512] rounded-2xl p-4 text-center border-2 border-[#f5c842]">
              <p className="text-white/60 text-sm">Net Cost</p>
              <p className="text-2xl font-bold text-[#f5c842]">{budgetData.currency} {budgetData.netCost.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-[#1a1512] border border-[#2c2c2c] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><span className="text-white/60">🏠 Rent:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.rent}</span></div>
              <div><span className="text-white/60">🍔 Food:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.food}</span></div>
              <div><span className="text-white/60">🚌 Transport:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.transport}</span></div>
              <div><span className="text-white/60">🛡️ Health:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.health}</span></div>
              <div><span className="text-white/60">📱 Misc:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.misc}</span></div>
              <div><span className="text-white/60">💰 Hourly Wage:</span> <span className="text-white">{budgetData.currency} {budgetData.breakdown.hourlyWage}</span></div>
            </div>
            <div className="mt-3 text-sm text-white/60">
              💼 You can work <strong className="text-white">{budgetData.breakdown.workHours} hours/week</strong> legally.
            </div>
          </div>

          {/* AI Tips */}
          <div className="bg-[#1a1512] rounded-2xl p-6 border border-[#f5c842]/30">
            <h3 className="text-lg font-semibold text-[#f5c842] flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" /> AI Budget Tips
            </h3>
            {tipsLoading ? (
              <p className="text-white/60 animate-pulse">Loading AI advice...</p>
            ) : (
              <div className="prose prose-invert max-w-none text-white/80">
                <ReactMarkdown>{aiTips}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
