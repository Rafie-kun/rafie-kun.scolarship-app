import React, { useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, Briefcase, Sparkles, DollarSign, Home, Utensils, 
  Bus, Shield, Wifi, Info, Calculator, Star, Award, CheckCircle, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

interface CostData {
  country: string;
  currency: string;
  tuitionPublic?: number;
  tuitionPrivate?: number;
  rentMonthly: number;
  foodMonthly: number;
  transportMonthly: number;
  healthInsuranceMonthly: number;
  miscMonthly: number;
  hourlyWage?: number;
  workHoursPerWeek?: number;
  universities?: { name: string; tuition: number }[];
}

export default function BudgetPlanner() {
  const { convertAmount, rates } = useTheme();
  const { profile } = useAuth();

  const [costData, setCostData] = useState<CostData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [aiTips, setAiTips] = useState('');
  const [tipsLoading, setTipsLoading] = useState(false);

  // Pre-load cost of living data
  useEffect(() => {
    fetch('/data/cost_of_living.json')
      .then(res => res.json())
      .then((data: CostData[]) => {
        setCostData(data);
        
        // Smarter Budget Auto-Selection based on user's Academic Profile
        if (profile) {
          // If profile has a saved school/university, see if we can find its country
          const matchedCountry = data.find(c => {
            const hasUni = (c.universities || []).some(u => 
              u.name.toLowerCase().includes((profile.highSchoolName || '').toLowerCase()) ||
              u.name.toLowerCase().includes((profile.collegeName || '').toLowerCase())
            );
            return hasUni || c.country.toLowerCase() === (profile.nationality || '').toLowerCase();
          });

          if (matchedCountry) {
            setSelectedCountry(matchedCountry.country);
          } else {
            // Default select the first available country
            setSelectedCountry(data[0]?.country || 'Germany');
          }
        } else if (data.length > 0) {
          setSelectedCountry(data[0].country);
        }
      })
      .catch(() => {
        // High quality local fallback data including full university details
        const fallback: CostData[] = [
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
            hourlyWage: 13,
            workHoursPerWeek: 20,
            universities: [
              { name: 'Technical University of Munich', tuition: 1500 },
              { name: 'LMU Munich', tuition: 1500 },
              { name: 'Heidelberg University', tuition: 1500 }
            ]
          },
          {
            country: 'United Kingdom',
            currency: 'GBP',
            tuitionPublic: 9250,
            tuitionPrivate: 35000,
            rentMonthly: 700,
            foodMonthly: 300,
            transportMonthly: 150,
            healthInsuranceMonthly: 120,
            miscMonthly: 200,
            hourlyWage: 11,
            workHoursPerWeek: 20,
            universities: [
              { name: 'University of Oxford', tuition: 35000 },
              { name: 'University of Cambridge', tuition: 35000 },
              { name: 'Imperial College London', tuition: 35000 }
            ]
          },
          {
            country: 'United States',
            currency: 'USD',
            tuitionPublic: 25000,
            tuitionPrivate: 55000,
            rentMonthly: 1200,
            foodMonthly: 400,
            transportMonthly: 150,
            healthInsuranceMonthly: 300,
            miscMonthly: 250,
            hourlyWage: 15,
            workHoursPerWeek: 20,
            universities: [
              { name: 'Harvard University', tuition: 55000 },
              { name: 'Stanford University', tuition: 57000 },
              { name: 'MIT', tuition: 55500 }
            ]
          }
        ];
        setCostData(fallback);
        setSelectedCountry('Germany');
      });
  }, [profile]);

  // Robust resolver for country universities including Canada, France, Japan, Switzerland, etc.
  const getUniversitiesForCountry = (countryName: string): { name: string; tuition: number }[] => {
    const country = costData.find(c => c.country === countryName);
    if (!country) return [];

    if (country.universities && country.universities.length > 0) {
      return country.universities;
    }

    // High quality dynamic fallback universities for the missing entries in cost_of_living.json
    const defaults: Record<string, { name: string; tuition: number }[]> = {
      'Canada': [
        { name: 'University of Toronto', tuition: 32000 },
        { name: 'University of British Columbia', tuition: 30000 },
        { name: 'McGill University', tuition: 28000 }
      ],
      'France': [
        { name: 'Sorbonne University', tuition: 3200 },
        { name: 'École Polytechnique', tuition: 14000 },
        { name: 'Sciences Po', tuition: 11000 }
      ],
      'Japan': [
        { name: 'University of Tokyo', tuition: 5500 },
        { name: 'Kyoto University', tuition: 5400 },
        { name: 'Waseda University', tuition: 8500 }
      ],
      'Australia': [
        { name: 'University of Melbourne', tuition: 29000 },
        { name: 'University of Sydney', tuition: 28000 },
        { name: 'Australian National University', tuition: 27500 }
      ],
      'Singapore': [
        { name: 'National University of Singapore (NUS)', tuition: 16000 },
        { name: 'Nanyang Technological University (NTU)', tuition: 15500 }
      ],
      'Netherlands': [
        { name: 'University of Amsterdam', tuition: 12500 },
        { name: 'Delft University of Technology', tuition: 14000 }
      ],
      'Switzerland': [
        { name: 'ETH Zurich', tuition: 1800 },
        { name: 'EPFL', tuition: 1800 },
        { name: 'University of Geneva', tuition: 1400 }
      ]
    };

    return defaults[countryName] || [
      { name: `${countryName} National University`, tuition: country.tuitionPublic || 4500 },
      { name: `${countryName} Institute of Technology`, tuition: country.tuitionPrivate || 16000 }
    ];
  };

  // Set default university when country changes
  useEffect(() => {
    if (selectedCountry) {
      const unis = getUniversitiesForCountry(selectedCountry);
      if (unis.length > 0) {
        setSelectedUniversity(unis[0].name);
      }
    }
  }, [selectedCountry]);

  const fmt = (localAmt: number) => {
    if (!budgetData) return "";
    const originalCurrency = budgetData.currency;
    const rateToUsd = rates[originalCurrency] || 1.0;
    const usdValue = localAmt / rateToUsd;
    return convertAmount(usdValue);
  };

  const calculateBudget = () => {
    playClickSound();
    if (!selectedCountry) return;

    const country = costData.find(c => c.country === selectedCountry);
    if (!country) return;

    const unis = getUniversitiesForCountry(selectedCountry);
    const uni = unis.find(u => u.name === selectedUniversity) || unis[0];
    if (!uni) return;

    // Fill missing properties cleanly
    const tuitionPublic = country.tuitionPublic || 3500;
    const tuitionPrivate = country.tuitionPrivate || 15000;
    const hourlyWage = country.hourlyWage || 12;
    const workHours = country.workHoursPerWeek || 20;

    const tuition = uni.tuition || (isPrivate ? tuitionPrivate : tuitionPublic);
    const livingMonthly = country.rentMonthly + country.foodMonthly + country.transportMonthly + country.healthInsuranceMonthly + country.miscMonthly;
    const livingYearly = livingMonthly * 12;
    const totalCost = tuition + livingYearly;

    const monthlyEarnings = hourlyWage * workHours * 4;
    const yearlyEarnings = monthlyEarnings * 12;

    // Smart calculation offset from scholarships (deducts 3000 USD if they have high GPAs or scholarships saved)
    let scholarshipOffset = 0;
    if (profile && (profile.gpa || 3.0) >= 3.7) {
      scholarshipOffset = 5000; // Merit-based auto-scholarship prediction offset
    }

    const netCost = Math.max(0, totalCost - yearlyEarnings - scholarshipOffset);

    setBudgetData({
      country: country.country,
      currency: country.currency,
      tuition,
      livingMonthly,
      livingYearly,
      totalCost,
      monthlyEarnings,
      yearlyEarnings,
      scholarshipOffset,
      netCost,
      breakdown: {
        rent: country.rentMonthly,
        food: country.foodMonthly,
        transport: country.transportMonthly,
        health: country.healthInsuranceMonthly,
        misc: country.miscMonthly,
        hourlyWage,
        workHours
      }
    });

    // Get AI tips
    fetchAITips(country, uni, totalCost, yearlyEarnings, netCost, scholarshipOffset);
  };

  const fetchAITips = async (country: CostData, uni: any, totalCost: number, yearlyEarnings: number, netCost: number, scholarshipOffset: number) => {
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
          hourlyWage: country.hourlyWage || 12,
          workHours: country.workHoursPerWeek || 20,
          scholarshipOffset
        })
      });
      const data = await res.json();
      setAiTips(data.tips || 'No custom Scribe matrix tips available.');
    } catch (err) {
      setAiTips('Unable to fetch AI tips. Standard guidelines: Optimize student housing sharing and lock in low-cost public transit passes early.');
    } finally {
      setTipsLoading(false);
    }
  };

  const activeUnis = selectedCountry ? getUniversitiesForCountry(selectedCountry) : [];

  return (
    <div className="space-y-6" id="scholarpath-budget-planner">
      
      {/* Title Header Panel */}
      <div className="mc-window bg-[#322d29] border-4 border-black font-mono">
        <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
          <Coins className="w-4.5 h-4.5 text-[#ffff55]" /> Budget Treasury Scribe
        </h3>
        <p className="text-stone-300 text-xs mt-1.5 leading-normal">
          Plan study abroad costs, pre-calculate living expenses dynamically, and predict part‑time wage dividends legally permitted in your target destination.
        </p>
      </div>

      {/* Grid: Inputs Configuration (Minecraft Styled) */}
      <div className="mc-window bg-[#2a2421] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#171412,inset_4px_4px_0_#433833] space-y-4">
        <h4 className="font-press text-[9.5px] text-[#ffaa00] mc-text-shadow uppercase pb-1.5 border-b border-black flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-[#ffaa00]" /> Config Treasury Parameters
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-stone-300">
          
          <div className="flex flex-col gap-1.5">
            <span className="text-stone-400 uppercase text-[9px] font-bold">Target Destination Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setBudgetData(null); }}
              className="bg-[#141414] border-2 border-black p-2.5 outline-none text-stone-200"
            >
              <option value="">Select country...</option>
              {costData.map(c => (
                <option key={c.country} value={c.country}>{c.country}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-stone-400 uppercase text-[9px] font-bold">Target Higher Institution:</span>
            <select
              value={selectedUniversity}
              onChange={(e) => { setSelectedUniversity(e.target.value); setBudgetData(null); }}
              className="bg-[#141414] border-2 border-black p-2.5 outline-none text-stone-200 disabled:opacity-50"
              disabled={!selectedCountry}
            >
              {activeUnis.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={calculateBudget}
          disabled={!selectedCountry}
          className="mc-btn w-full font-press text-[10px] py-3 uppercase text-[#ffff55] border-2 border-yellow-500 hover:bg-stone-850 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⛏️ Calculate Treasury Budget Matrix
        </button>
      </div>

      {/* Results Outcomes (Minecraft bento style grid) */}
      {budgetData && (
        <div className="space-y-6">
          
          {/* Top level treasury summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            
            <div className="bg-[#141414] border-2 border-black p-4 text-center space-y-1">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Total Annual Cost</span>
              <span className="font-press text-lg text-red-400 mc-text-shadow block">{fmt(budgetData.totalCost)}</span>
              <span className="text-[9px] text-stone-500">Tuition + Living Yearly</span>
            </div>

            <div className="bg-[#141414] border-2 border-black p-4 text-center space-y-1">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Part‑Time Wage Dividend</span>
              <span className="font-press text-lg text-[#55ff55] mc-text-shadow block">+{fmt(budgetData.yearlyEarnings)}</span>
              <span className="text-[9px] text-stone-500">Wages of {budgetData.breakdown.workHours}h/week</span>
            </div>

            <div className="bg-[#141414] border-2 border-black p-4 text-center space-y-1">
              <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Predicted Merit Scholarships</span>
              <span className="font-press text-lg text-[#ffff55] mc-text-shadow block">-{budgetData.scholarshipOffset > 0 ? fmt(budgetData.scholarshipOffset) : '$0'}</span>
              <span className="text-[9px] text-stone-500">GPA offset deduction</span>
            </div>

            <div className="bg-[#141414] border-4 border-[#ffff55] p-4 text-center space-y-1 relative">
              <div className="absolute top-0.5 right-0.5 px-1 bg-[#ffff55] text-black font-press text-[7px]">BEST VALUE</div>
              <span className="text-stone-200 uppercase text-[8.5px] font-bold block">Calculated Net Cost</span>
              <span className="font-press text-lg text-cyan-400 mc-text-shadow block">{fmt(budgetData.netCost)}</span>
              <span className="text-[9px] text-stone-400 font-bold">Absolute Annual Out‑of‑pocket</span>
            </div>
          </div>

          {/* Breakdown lists and values */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left breakdown ledger card */}
            <div className="md:col-span-7 mc-window bg-[#2d2a29] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-4">
              <h4 className="font-press text-[9.5px] text-[#ffff55] uppercase border-b border-black pb-2 flex items-center gap-1.5 mc-text-shadow">
                <Home className="w-4 h-4 text-sky-400 shrink-0" /> Monthly Living Expense Ledger
              </h4>

              <div className="space-y-2 font-mono text-xs">
                {[
                  { icon: '🏠', label: 'Student Housing / Rent', val: budgetData.breakdown.rent },
                  { icon: '🍔', label: 'Subsistence / Food', val: budgetData.breakdown.food },
                  { icon: '🚌', label: 'Municipal Transport Pass', val: budgetData.breakdown.transport },
                  { icon: '🛡️', label: 'Mandatory Health Insurance', val: budgetData.breakdown.health },
                  { icon: '📱', label: 'Miscellaneous / Airtime', val: budgetData.breakdown.misc }
                ].map((exp, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black/30 p-2.5 border border-stone-850">
                    <span className="text-stone-300">{exp.icon} {exp.label}</span>
                    <span className="font-bold text-stone-100">{fmt(exp.val)} <span className="text-[10px] text-stone-500">/mo</span></span>
                  </div>
                ))}

                <div className="bg-black/45 border-2 border-black p-3.5 mt-4 space-y-2">
                  <div className="flex justify-between text-[#55ff55] font-bold text-xs uppercase">
                    <span>💼 Permitted Part-time Hours:</span>
                    <span>{budgetData.breakdown.workHours} Hours / Week</span>
                  </div>
                  <div className="flex justify-between text-[#ffff55] font-bold text-xs uppercase">
                    <span>💰 Local Minimum Hourly Wage:</span>
                    <span>{fmt(budgetData.breakdown.hourlyWage * (rates[budgetData.currency] || 1))} / Hour</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right AI recommendations column */}
            <div className="md:col-span-5 mc-window bg-[#2d2a29] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-4">
              <h4 className="font-press text-[9.5px] text-[#ffaa00] uppercase border-b border-black pb-2 flex items-center gap-1.5 mc-text-shadow">
                <Sparkles className="w-4.5 h-4.5 text-[#ffaa00] shrink-0 animate-pulse" /> Scribe AI Financial Tips
              </h4>

              {tipsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 font-press text-[9px] text-[#ffff55] gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>SYNCHRONIZING FINANCIAL CHECKS...</span>
                </div>
              ) : (
                <div className="prose prose-stone max-w-none text-stone-300 font-mono text-[11px] leading-relaxed select-text pr-1 max-h-[300px] overflow-y-auto scrollbar-thin">
                  <ReactMarkdown>{aiTips}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
