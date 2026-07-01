import React, { useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, Briefcase, Sparkles, Home, Utensils, 
  Bus, Shield, Info, Calculator, AlertTriangle, ShieldCheck, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

interface CostOfLivingEntry {
  id: string;
  country: string;
  rentMonthly: number;
  foodMonthly: number;
  transportMonthly: number;
  healthInsuranceMonthly: number;
  miscMonthly?: number;
  currency: string;
}

interface StudentJobEntry {
  title: string;
  hourlyWage: number;
  weeklyHourLimit: number;
  estimatedMonthlyEarnings: number;
  taxDeductionPercent: number;
  visaRestrictions: string;
  typicalEmployers: string;
  type: string;
}

interface TaxRuleEntry {
  taxFreeAllowanceYearly: number;
  baseTaxRatePercent: number;
  estimatedSocialContributionsPercent: number;
  specialStudentRules: string;
  allowanceCurrency: string;
}

export default function BudgetPlanner() {
  const { convertAmount, rates, themeMode } = useTheme();
  const { profile } = useAuth();

  // Loaded JSON Data
  const [colData, setColData] = useState<CostOfLivingEntry[]>([]);
  const [jobsData, setJobsData] = useState<Record<string, StudentJobEntry[]>>({});
  const [taxRulesData, setTaxRulesData] = useState<Record<string, TaxRuleEntry>>({});
  const [countries, setCountries] = useState<string[]>([]);

  // Selection states
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // Custom Income inputs
  const [stipend, setStipend] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  const [selectedJobIndex, setSelectedJobIndex] = useState<number>(-1);
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(15);
  const [customHourlyWage, setCustomHourlyWage] = useState<number>(0);

  // Custom Expenses inputs
  const [rent, setRent] = useState<number>(0);
  const [food, setFood] = useState<number>(0);
  const [transport, setTransport] = useState<number>(0);
  const [utilities, setUtilities] = useState<number>(0);
  const [insurance, setInsurance] = useState<number>(0);
  const [entertainment, setEntertainment] = useState<number>(0);
  const [health, setHealth] = useState<number>(0);
  const [books, setBooks] = useState<number>(0);
  const [personalCare, setPersonalCare] = useState<number>(0);
  const [misc, setMisc] = useState<number>(0);

  const [initializedForCountry, setInitializedForCountry] = useState('');

  // Initial Data Loading
  useEffect(() => {
    const loadAllBudgetData = async () => {
      try {
        const [colRes, jobsRes, taxRes] = await Promise.all([
          fetch('/data/cost_of_living.json').then(res => res.json()),
          fetch('/data/student_jobs.json').then(res => res.json()),
          fetch('/data/tax_rules.json').then(res => res.json())
        ]);

        // Support array style or object format for cost of living
        const colList: CostOfLivingEntry[] = Array.isArray(colRes) ? colRes : (colRes.countries || []);
        setColData(colList);

        // Normalize student jobs mapping
        const jobsMap = jobsRes.countries || {};
        setJobsData(jobsMap);

        // Normalize tax rules mapping
        const taxMap = taxRes.countries || {};
        setTaxRulesData(taxMap);

        // Extract list of all available countries
        const colCountries = colList.map(c => c.country);
        const uniqueCountries = Array.from(new Set([...colCountries, ...Object.keys(jobsMap), ...Object.keys(taxMap)]));
        setCountries(uniqueCountries);

        // Select default country based on user's profile
        const userCountry = profile?.country;
        if (userCountry && uniqueCountries.includes(userCountry)) {
          setSelectedCountry(userCountry);
        } else if (uniqueCountries.length > 0) {
          setSelectedCountry(uniqueCountries[0]);
        }
      } catch (e) {
        console.error("Could not load full budget engine databases, falling back to embedded metrics.", e);
        // Fallback placeholders
        const fallbackCol = [
          { id: "col-us", country: "United States", rentMonthly: 1200, foodMonthly: 400, transportMonthly: 120, healthInsuranceMonthly: 250, currency: "USD" },
          { id: "col-uk", country: "United Kingdom", rentMonthly: 750, foodMonthly: 320, transportMonthly: 110, healthInsuranceMonthly: 150, currency: "GBP" },
          { id: "col-de", country: "Germany", rentMonthly: 500, foodMonthly: 280, transportMonthly: 80, healthInsuranceMonthly: 110, currency: "EUR" }
        ];
        setColData(fallbackCol);
        setCountries(fallbackCol.map(c => c.country));
        setSelectedCountry("United States");
      }
    };

    loadAllBudgetData();
  }, [profile]);

  // Synchronize input fields when selected country changes
  useEffect(() => {
    if (!selectedCountry) return;

    const col = colData.find(c => c.country === selectedCountry);
    const countryJobs = jobsData[selectedCountry] || [];
    const firstJob = countryJobs[0];

    // Expenses Default from Cost of Living
    setRent(col?.rentMonthly || 600);
    setFood(col?.foodMonthly || 300);
    setTransport(col?.transportMonthly || 100);
    setUtilities(60); // Typical standard default
    setInsurance(col?.healthInsuranceMonthly || 120);
    setEntertainment(80);
    setHealth(50);
    setBooks(40);
    setPersonalCare(50);
    setMisc(col?.miscMonthly || 100);

    // Income Default from Student Jobs
    if (firstJob) {
      setSelectedJobIndex(0);
      setCustomHourlyWage(firstJob.hourlyWage);
      setHoursPerWeek(15);
    } else {
      setSelectedJobIndex(-1);
      setCustomHourlyWage(12);
      setHoursPerWeek(15);
    }

    setInitializedForCountry(selectedCountry);
  }, [selectedCountry, colData, jobsData]);

  // Handle manual selection adjustments
  const handleJobChange = (index: number) => {
    playClickSound();
    setSelectedJobIndex(index);
    const countryJobs = jobsData[selectedCountry] || [];
    const job = countryJobs[index];
    if (job) {
      setCustomHourlyWage(job.hourlyWage);
    }
  };

  // Perform All Smart Calculations Real-Time
  const colInfo = colData.find(c => c.country === selectedCountry);
  const countryJobs = jobsData[selectedCountry] || [];
  const selectedJob = selectedJobIndex >= 0 ? countryJobs[selectedJobIndex] : null;

  // 1. Gross wage calculation
  const monthlyGrossWage = customHourlyWage * hoursPerWeek * 4.33;
  const yearlyGrossWage = monthlyGrossWage * 12;

  // 2. Tax and social security evaluation
  const countryTaxRules = taxRulesData[selectedCountry] || {
    taxFreeAllowanceYearly: 10000,
    baseTaxRatePercent: 15,
    estimatedSocialContributionsPercent: 5.0,
    specialStudentRules: "Standard temporary student allowances applicable.",
    allowanceCurrency: "USD"
  };

  let estimatedYearlyTax = 0;
  if (yearlyGrossWage > countryTaxRules.taxFreeAllowanceYearly) {
    estimatedYearlyTax = (yearlyGrossWage - countryTaxRules.taxFreeAllowanceYearly) * (countryTaxRules.baseTaxRatePercent / 100);
  }
  const estimatedYearlySocial = yearlyGrossWage * (countryTaxRules.estimatedSocialContributionsPercent / 100);
  const totalYearlyDeductions = estimatedYearlyTax + estimatedYearlySocial;
  const monthlyTaxDeductions = totalYearlyDeductions / 12;

  // 3. Net wage calculation
  const monthlyNetWage = Math.max(0, monthlyGrossWage - monthlyTaxDeductions);

  // 4. Totals and final balance
  const totalMonthlyIncome = stipend + monthlyNetWage + otherIncome;
  const totalMonthlyExpenses = rent + food + transport + utilities + insurance + entertainment + health + books + personalCare + misc;
  const monthlySavings = totalMonthlyIncome - totalMonthlyExpenses;

  // Savings progress bar evaluation
  const expenseRatio = totalMonthlyIncome > 0 ? (totalMonthlyExpenses / totalMonthlyIncome) * 100 : 100;
  
  let progressBarColor = "bg-green-500";
  let budgetStatusText = "Aesthetic Balance Achieved";
  if (expenseRatio > 90) {
    progressBarColor = "bg-red-500 animate-pulse";
    budgetStatusText = "Treasury Deficit Warning";
  } else if (expenseRatio > 70) {
    progressBarColor = "bg-yellow-500";
    budgetStatusText = "Tight Scribe Balance";
  }

  // Warnings checks
  const hourLimitExceeded = selectedJob && hoursPerWeek > selectedJob.weeklyHourLimit;
  const deficitOccurred = totalMonthlyExpenses > totalMonthlyIncome;

  const isMinecraft = themeMode === 'minecraft';

  return (
    <div className="space-y-6" id="scholarpath-budget-planner">
      {/* Header Panel */}
      <div className="mc-window bg-[#322d29] border-4 border-black font-mono">
        <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
          <Coins className="w-4.5 h-4.5 text-[#ffff55]" /> Treasury Budget Planner
        </h3>
        <p className="text-stone-300 text-xs mt-1.5 leading-normal">
          Evaluate admissions costs, model local progressive student taxes, and simulate part-time jobs income legally authorized in your destination biome.
        </p>
      </div>

      {/* Profile Unconfigured Warnings Bar */}
      {(!profile?.country) && (
        <div className="mc-window bg-amber-950 border-4 border-amber-600 p-4 font-mono text-xs text-amber-200 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-[#ffff55] block uppercase">Academic Profile Country Unconfigured</span>
            Your Scribe card does not specify a target country. We have loaded a default country for evaluation. Please configure your profile to get personalized automated maps!
          </div>
        </div>
      )}

      {/* Selector and Main Controls */}
      <div className="mc-window bg-[#2a2421] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#171412,inset_4px_4px_0_#433833] space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 font-mono text-xs">
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-stone-400 uppercase text-[9px] font-bold">Target Evaluation Biome (Country):</span>
            <select
              value={selectedCountry}
              onChange={(e) => { playClickSound(); setSelectedCountry(e.target.value); }}
              className="bg-[#141414] border-2 border-black p-2.5 outline-none text-stone-200 focus:border-[#ffff55]"
            >
              <option value="">Select country...</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Multi-Column Workbench */}
        {initializedForCountry === selectedCountry && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
            
            {/* Left side: Incomes Config */}
            <div className="lg:col-span-6 bg-black/35 p-4 border-2 border-black space-y-4">
              <h4 className="font-press text-[9px] text-[#55ff55] uppercase pb-2 border-b border-stone-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> 1. Monthly Revenue Streams
              </h4>

              {/* Scholarship Stipend */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-300 font-bold uppercase text-[9px]">Scholarship / Stipend Support:</span>
                  <span className="text-[#ffff55]">{convertAmount(stipend)} / mo</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="4000" 
                  step="50"
                  value={stipend}
                  onChange={(e) => setStipend(Number(e.target.value))}
                  className="w-full accent-[#ffff55] bg-stone-900 h-2 cursor-pointer"
                />
              </div>

              {/* Student Job Select */}
              <div className="space-y-1.5">
                <span className="text-stone-300 font-bold uppercase text-[9px] block">Authorized Student Job:</span>
                <select
                  value={selectedJobIndex}
                  onChange={(e) => handleJobChange(Number(e.target.value))}
                  className="w-full bg-[#141414] border border-stone-700 p-2 outline-none text-stone-200"
                >
                  <option value={-1}>No Employment Gig</option>
                  {countryJobs.map((j, idx) => (
                    <option key={idx} value={idx}>{j.type.toUpperCase()}: {j.title} (~{convertAmount(j.hourlyWage)}/hr)</option>
                  ))}
                </select>
              </div>

              {/* Work Hours and Wage sliders */}
              {selectedJobIndex >= 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Hours Worked / Week:</span>
                      <span className={hourLimitExceeded ? "text-[#ff5555] font-bold" : "text-stone-300"}>{hoursPerWeek} hrs</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="30" 
                      step="1"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                      className="w-full accent-green-500 bg-stone-900 h-2 cursor-pointer"
                    />
                    {hourLimitExceeded && (
                      <p className="text-[#ff5555] text-[8px] leading-tight uppercase">
                        ⚠️ LIMIT: Legal cap is {selectedJob?.weeklyHourLimit} hrs!
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-300 uppercase text-[9px] font-bold">Hourly Wage rate:</span>
                      <span className="text-stone-300">{convertAmount(customHourlyWage)}/hr</span>
                    </div>
                    <input 
                      type="range" 
                      min={Math.floor(customHourlyWage * 0.5) || 5} 
                      max={Math.floor(customHourlyWage * 2) || 40} 
                      step="0.5"
                      value={customHourlyWage}
                      onChange={(e) => setCustomHourlyWage(Number(e.target.value))}
                      className="w-full accent-green-500 bg-stone-900 h-2 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Other family support income */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-300 font-bold uppercase text-[9px]">Parental or Savings Contribution:</span>
                  <span className="text-stone-300">{convertAmount(otherIncome)} / mo</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3000" 
                  step="50"
                  value={otherIncome}
                  onChange={(e) => setOtherIncome(Number(e.target.value))}
                  className="w-full accent-green-500 bg-stone-900 h-2 cursor-pointer"
                />
              </div>

              {/* Gross vs Net Smart Tax engine visualizer panel */}
              {selectedJobIndex >= 0 && (
                <div className="bg-[#141414] p-3 border border-stone-800 space-y-2 mt-4 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total Monthly Gross Pay:</span>
                    <span className="text-[#ffff55] line-through font-semibold">{convertAmount(monthlyGrossWage)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Yearly Estimated Gross:</span>
                    <span>{convertAmount(yearlyGrossWage)}</span>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Tax-Free Base Allowance:</span>
                    <span className="text-stone-300">{convertAmount(countryTaxRules.taxFreeAllowanceYearly)}</span>
                  </div>
                  <div className="flex justify-between text-[#ff5555]">
                    <span>Estimated Income Tax ({countryTaxRules.baseTaxRatePercent}%):</span>
                    <span>-{convertAmount(estimatedYearlyTax / 12)} / mo</span>
                  </div>
                  <div className="flex justify-between text-[#ff5555]">
                    <span>Social Contributions ({countryTaxRules.estimatedSocialContributionsPercent}%):</span>
                    <span>-{convertAmount(estimatedYearlySocial / 12)} / mo</span>
                  </div>
                  <div className="border-t border-stone-800 pt-1.5 flex justify-between text-[#55ff55] font-bold">
                    <span className="uppercase">Net Part-time Salary:</span>
                    <span>{convertAmount(monthlyNetWage)} / mo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Expenses Config */}
            <div className="lg:col-span-6 bg-black/35 p-4 border-2 border-black space-y-4">
              <h4 className="font-press text-[9px] text-[#ff5555] uppercase pb-2 border-b border-stone-800 flex items-center gap-2">
                <Home className="w-4 h-4" /> 2. Monthly Expense Ledger
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Rent slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Rent & Housing:</span>
                    <span className="text-stone-200">{convertAmount(rent)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="2500" step="20" value={rent} 
                    onChange={(e) => setRent(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Food slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Subsistence / Food:</span>
                    <span className="text-stone-200">{convertAmount(food)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1000" step="10" value={food} 
                    onChange={(e) => setFood(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Transport slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Local Transport pass:</span>
                    <span className="text-stone-200">{convertAmount(transport)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="400" step="5" value={transport} 
                    onChange={(e) => setTransport(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Utilities slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Utilities & WiFi:</span>
                    <span className="text-stone-200">{convertAmount(utilities)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="400" step="5" value={utilities} 
                    onChange={(e) => setUtilities(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Insurance slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Health Insurance:</span>
                    <span className="text-stone-200">{convertAmount(insurance)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="500" step="5" value={insurance} 
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Entertainment slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Social & Entertainment:</span>
                    <span className="text-stone-200">{convertAmount(entertainment)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="600" step="10" value={entertainment} 
                    onChange={(e) => setEntertainment(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Health / Medical slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Health & Pharmacy:</span>
                    <span className="text-stone-200">{convertAmount(health)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="400" step="5" value={health} 
                    onChange={(e) => setHealth(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Books & Supplies slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Books & Supplies:</span>
                    <span className="text-stone-200">{convertAmount(books)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="300" step="5" value={books} 
                    onChange={(e) => setBooks(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Personal Care slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Personal Care / Gym:</span>
                    <span className="text-stone-200">{convertAmount(personalCare)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="300" step="5" value={personalCare} 
                    onChange={(e) => setPersonalCare(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

                {/* Misc slider */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400 uppercase text-[8px] font-bold">Miscellaneous pocket:</span>
                    <span className="text-stone-200">{convertAmount(misc)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="500" step="10" value={misc} 
                    onChange={(e) => setMisc(Number(e.target.value))}
                    className="w-full accent-red-500 bg-stone-900 h-1 cursor-pointer"
                  />
                </div>

              </div>
            </div>

          </div>
        )}

        {/* Dynamic Financial Results Outcomes */}
        {initializedForCountry === selectedCountry && (
          <div className="space-y-6 pt-2">
            
            {/* Top Level Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
              
              <div className="bg-[#141414] border-2 border-black p-4 space-y-1">
                <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Total Monthly Revenue</span>
                <span className="font-press text-[15px] text-[#55ff55] mc-text-shadow block">+{convertAmount(totalMonthlyIncome)}</span>
                <span className="text-[9px] text-stone-500 uppercase">Stipends + Net Wages + Support</span>
              </div>

              <div className="bg-[#141414] border-2 border-black p-4 space-y-1">
                <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Total Monthly Expenses</span>
                <span className="font-press text-[15px] text-red-400 mc-text-shadow block">-{convertAmount(totalMonthlyExpenses)}</span>
                <span className="text-[9px] text-stone-500 uppercase">Rent + Food + Bills + Personal</span>
              </div>

              <div className="bg-[#141414] border-2 border-black p-4 space-y-1">
                <span className="text-stone-400 uppercase text-[8.5px] font-bold block">Calculated Net Balance</span>
                <span className={`font-press text-[15px] mc-text-shadow block ${deficitOccurred ? "text-red-500 animate-pulse" : "text-[#ffff55]"}`}>
                  {deficitOccurred ? "-" : "+"}{convertAmount(Math.abs(monthlySavings))}
                </span>
                <span className="text-[9px] text-stone-500 uppercase">Expected Net monthly savings</span>
              </div>

            </div>

            {/* High-quality Minecraft-themed progress bar */}
            <div className="bg-[#141414] border-2 border-black p-4.5 font-mono">
              <div className="flex justify-between items-center pb-2 text-[10px] uppercase font-bold text-stone-300">
                <span>Expense Ratio Visualizer:</span>
                <span className={deficitOccurred ? "text-[#ff5555]" : "text-stone-300"}>
                  {budgetStatusText} ({Math.round(expenseRatio)}%)
                </span>
              </div>
              <div className="w-full bg-stone-900 border-2 border-black h-6 p-0.5 rounded-none overflow-hidden flex">
                <div 
                  className={`${progressBarColor} h-full transition-all duration-300`}
                  style={{ width: `${Math.min(100, expenseRatio)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-stone-500 pt-1.5 uppercase">
                <span>0% EXPENSES</span>
                <span>50% MARGIN</span>
                <span>100% EXCEEDED</span>
              </div>
            </div>

            {/* Warning Cards & Rules Summaries Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Warnings and compliance alerts */}
              <div className="bg-stone-900/50 p-4 border border-stone-800 space-y-3 font-mono text-xs">
                <h5 className="font-press text-[8.5px] text-[#ffaa00] uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#ffaa00]" /> Compliance & Deficits checks
                </h5>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  {deficitOccurred ? (
                    <div className="text-[#ff5555] uppercase font-bold flex items-center gap-2">
                      <span>⚠️ Warning: Monthly expenditures exceed income! Adjust rent or increase stipend support.</span>
                    </div>
                  ) : (
                    <div className="text-[#55ff55] flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-[#55ff55]" /> SURPLUS: YOUR TREASURY BUDGET IS BALANCED COMPLIANTLY!
                    </div>
                  )}

                  {hourLimitExceeded ? (
                    <div className="text-[#ff5555] uppercase font-bold flex items-center gap-2">
                      <span>⚠️ Legal Violation Warning: Work hours exceed the weekly limit authorized for students!</span>
                    </div>
                  ) : (
                    <div className="text-stone-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" /> Hourly limits verified and compliant.
                    </div>
                  )}

                  {selectedJob && (
                    <div className="p-2.5 bg-black/40 text-stone-400 mt-2 text-[10px]">
                      <span className="font-bold text-stone-300 block uppercase pb-1">Visa Restriction detail:</span>
                      {selectedJob.visaRestrictions}
                    </div>
                  )}
                </div>
              </div>

              {/* Special student tax rules */}
              <div className="bg-stone-900/50 p-4 border border-stone-800 space-y-3 font-mono text-xs">
                <h5 className="font-press text-[8.5px] text-[#ffff55] uppercase flex items-center gap-1.5">
                  <Info className="w-4.5 h-4.5 text-[#ffff55]" /> Student Tax Exemption Guidelines
                </h5>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  {countryTaxRules.specialStudentRules}
                </p>
                <div className="p-2.5 bg-black/40 text-[10px] text-stone-400">
                  <span className="font-bold text-stone-300 block uppercase">Yearly Scribe Exemption Margin:</span>
                  Students enjoy a personal tax allowance of <strong className="text-stone-200">{convertAmount(countryTaxRules.taxFreeAllowanceYearly)}</strong> per calendar year in {selectedCountry}. Social security tax deductions are estimated based on local statutory guidelines.
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
