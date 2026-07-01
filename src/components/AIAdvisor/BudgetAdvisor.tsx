import React, { useState, useEffect } from "react";
import { Sparkles, Coins, HelpCircle, Briefcase, ChevronRight, CheckSquare, Square, Trophy, DollarSign } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { playClickSound, playAdvancementSound } from "../../utils/sound";

export default function BudgetAdvisor() {
  const { authorizedFetch, rewardPoints, isLoggedIn } = useAuth();
  const { convertAmount, rates } = useTheme();

  const fmt = (localAmt: number) => {
    if (!calcs) return "";
    const originalCurrency = calcs.currency as any;
    const rateToUsd = rates[originalCurrency] || 1.0;
    const usdValue = localAmt / rateToUsd;
    return convertAmount(usdValue);
  };

  const [costData, setCostData] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [degree, setDegree] = useState("Master's Degree");
  const [tuition, setTuition] = useState("15000");
  const [partTimeWork, setPartTimeWork] = useState(true);
  const [workHours, setWorkHours] = useState("20");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const [calcs, setCalcs] = useState<any>(null);
  const [isXpClaimed, setIsXpClaimed] = useState(false);
  const [xpSuccess, setXpSuccess] = useState("");

  useEffect(() => {
    fetch("/data/cost_of_living.json")
      .then((res) => res.json())
      .then((data) => {
        setCostData(data);
        if (data.length > 0) {
          setSelectedCountry(data[0].country);
        }
      })
      .catch((err) => console.error("Error loading cost data in budget advisor:", err));
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const countryData = costData.find((c) => c.country === selectedCountry);
      if (countryData && countryData.universities && countryData.universities.length > 0) {
        setSelectedUniversity(countryData.universities[0].name);
        setTuition(String(countryData.universities[0].tuition || countryData.tuitionPublic || 15000));
      }
    }
  }, [selectedCountry, costData]);

  const handleCalculateBudget = async () => {
    playClickSound();
    if (!selectedCountry) return;
    setLoading(true);
    setXpSuccess("");
    try {
      const res = await authorizedFetch("/api/ai/budget-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          university: selectedUniversity,
          degree,
          tuition: parseFloat(tuition) || 0,
          partTimeWork,
          workHours: parseFloat(workHours) || 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setCalcs(data.calculations);
      } else {
        throw new Error("Budget advisor failed");
      }
    } catch (e) {
      console.error(e);
      setReport("### 📡 Advisor Link Disrupted\n\nCould not compile financial advisor metrics. Verify connection parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXp = async () => {
    if (isXpClaimed) return;
    playAdvancementSound();
    setIsXpClaimed(true);
    await rewardPoints(30, "Completed AI Budget Consultant Review");
    setXpSuccess("Loot Claimed! +30 Fellowship XP points added to your score!");
    setTimeout(() => setXpSuccess(""), 5000);
  };

  return (
    <div className="space-y-6" id="scholarpath-ai-budget-advisor">
      {/* Banner */}
      <div className="bg-[#141414] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#0a0a0a,inset_4px_4px_0_#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-[#2ecc71] border-2 border-black p-3 [box-shadow:2px_2px_0_#000] text-black">
            <Coins className="w-8 h-8 shrink-0 animate-bounce" />
          </div>
          <div>
            <h3 className="font-press text-[11px] uppercase text-[#2ecc71] tracking-wider mc-text-shadow">
              AI Budget Consultant
            </h3>
            <p className="text-xs text-stone-300 font-mono mt-1">
              Deep budget analysis and legal work-study advice for prospective international students.
            </p>
          </div>
        </div>
      </div>

      {xpSuccess && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#55ff55] shrink-0" />
          <span className="mc-text-shadow font-press text-[9px]">{xpSuccess}</span>
        </div>
      )}

      {/* Inputs panel */}
      <div className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4">
        <h4 className="font-press text-[9px] text-[#2ecc71] uppercase pb-2 border-b border-stone-700 tracking-wider">
          🛠️ Finance Parameters Configurator
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="text-stone-300 block mb-1">Target Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCalcs(null);
              }}
              className="w-full bg-[#141414] border-2 border-black p-2 text-stone-200 focus:outline-none focus:border-[#2ecc71]"
            >
              {costData.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-stone-300 block mb-1">Target University</label>
            <input
              type="text"
              value={selectedUniversity}
              onChange={(e) => {
                setSelectedUniversity(e.target.value);
                setCalcs(null);
              }}
              className="w-full bg-[#141414] border-2 border-black p-2 text-stone-200 focus:outline-none focus:border-[#2ecc71]"
              placeholder="e.g. Technical University Munich"
            />
          </div>

          <div>
            <label className="text-stone-300 block mb-1">Intended Degree</label>
            <select
              value={degree}
              onChange={(e) => {
                setDegree(e.target.value);
                setCalcs(null);
              }}
              className="w-full bg-[#141414] border-2 border-black p-2 text-stone-200 focus:outline-none focus:border-[#2ecc71]"
            >
              <option value="Bachelor's Degree">Bachelor's Degree</option>
              <option value="Master's Degree">Master's Degree</option>
              <option value="Doctoral Degree">Doctoral Degree</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="text-stone-300 block mb-1">Yearly Tuition Cost (Local Currency)</label>
            <input
              type="number"
              value={tuition}
              onChange={(e) => {
                setTuition(e.target.value);
                setCalcs(null);
              }}
              className="w-full bg-[#141414] border-2 border-black p-2 text-stone-200 focus:outline-none focus:border-[#2ecc71]"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div
              onClick={() => {
                playClickSound();
                setPartTimeWork(!partTimeWork);
                setCalcs(null);
              }}
              className="flex items-center gap-2 cursor-pointer select-none py-3 text-stone-300 hover:text-stone-100"
            >
              <div
                className={`w-4 h-4 border-2 border-black flex items-center justify-center shrink-0 ${
                  partTimeWork ? "bg-[#55ff55]" : "bg-[#141414]"
                }`}
              >
                {partTimeWork && <div className="w-1.5 h-1.5 bg-black" />}
              </div>
              <span>Intend Part-time work legally</span>
            </div>
          </div>

          <div>
            <label className="text-stone-300 block mb-1">Weekly Work Hours (Target)</label>
            <input
              type="number"
              disabled={!partTimeWork}
              value={workHours}
              onChange={(e) => {
                setWorkHours(e.target.value);
                setCalcs(null);
              }}
              className="w-full bg-[#141414] border-2 border-black p-2 text-stone-200 focus:outline-none focus:border-[#2ecc71] disabled:opacity-50 disabled:cursor-not-allowed"
              max="20"
              min="0"
            />
          </div>
        </div>

        <button
          onClick={handleCalculateBudget}
          disabled={loading || !selectedCountry}
          className="w-full py-3 bg-[#2ecc71] hover:bg-[#27ae60] text-black font-press text-[9px] uppercase tracking-wider transition-all"
        >
          {loading ? "Calculating..." : "🚀 Run Financial Simulation Analysis"}
        </button>
      </div>

      {/* Split results & analysis */}
      {calcs && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calculations box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#2c2c2c] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-4 font-mono text-xs text-stone-300">
              <h4 className="font-press text-[9px] text-[#2ecc71] uppercase pb-2 border-b border-stone-700 tracking-wider">
                💰 Budget Results
              </h4>

              <div className="grid grid-cols-1 gap-2 border-b border-stone-800 pb-3">
                <div className="flex justify-between">
                  <span>Yearly Tuition Fee:</span>
                  <span className="text-stone-100 font-bold">
                    {fmt(calcs.tuition)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Living Expenses:</span>
                  <span className="text-stone-100 font-bold">
                    {fmt(calcs.livingCostsAnnual)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-stone-800 pt-2 text-[#ffaa00] font-bold">
                  <span>Total Annual Cost:</span>
                  <span>
                    {fmt(calcs.totalAnnualCost)}
                  </span>
                </div>
              </div>

              {calcs.partTimeWork ? (
                <div className="grid grid-cols-1 gap-2 border-b border-stone-800 pb-3 bg-[#141414]/50 p-2 border border-stone-800">
                  <div className="flex justify-between">
                    <span>Est. Hourly Wage:</span>
                    <span className="text-[#55ff55]">
                      {fmt(calcs.hourlyWage)}/hr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly Working Hours:</span>
                    <span className="text-stone-200 font-bold">{calcs.workHoursPerWeek} hrs</span>
                  </div>
                  <div className="flex justify-between border-t border-stone-800 pt-2 text-[#55ff55] font-bold">
                    <span>Est. Yearly Earnings:</span>
                    <span>
                      + {fmt(calcs.yearlyEarnings)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-stone-400 italic">
                  *No part-time working intentions entered. Funding strategy must rely 100% on external fellowship grants.
                </p>
              )}

              <div className="flex justify-between items-center bg-[#141414] p-3 border-2 border-black text-sm">
                <span className="font-bold text-stone-200">OUT-OF-POCKET NET:</span>
                <span className="font-press text-[10px] text-[#ff5552] mc-text-shadow">
                  {fmt(calcs.netCost)}
                </span>
              </div>

              {/* Monthly breakdown itemized */}
              <div className="bg-[#141414] border border-stone-800 p-3 space-y-2">
                <p className="text-[9px] font-press text-stone-400 uppercase">Itemized Living Costs (Monthly)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Rent:</span>
                    <span className="text-stone-200">
                      {fmt(calcs.rentMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food:</span>
                    <span className="text-stone-200">
                      {fmt(calcs.foodMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transit:</span>
                    <span className="text-stone-200">
                      {fmt(calcs.transportMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance:</span>
                    <span className="text-stone-200">
                      {fmt(calcs.healthInsuranceMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2 border-t border-stone-800 pt-1 text-[#2ecc71] font-bold">
                    <span>Total Monthly:</span>
                    <span>
                      {fmt(calcs.livingCostsMonthly)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Claim consult reward button */}
              <button
                onClick={handleClaimXp}
                disabled={isXpClaimed}
                className={`w-full mt-2 py-2 text-[9px] font-press uppercase tracking-wider border-2 border-black rounded-none ${
                  isXpClaimed
                    ? "bg-stone-800 text-stone-500 border-stone-900 cursor-not-allowed"
                    : "bg-[#ffaa00] text-black hover:bg-[#ffbb33]"
                }`}
              >
                {isXpClaimed ? "🏆 Consultant Claimed" : "🎁 Claim Consultation XP"}
              </button>
            </div>
          </div>

          {/* AI Advisor report */}
          <div className="lg:col-span-7">
            <div className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] min-h-[460px] flex flex-col">
              <h4 className="font-press text-[9px] text-[#2ecc71] uppercase mb-4 tracking-wider border-b border-stone-700 pb-2 flex items-center gap-2 mc-text-shadow">
                <Sparkles className="w-4 h-4 shrink-0 text-[#2ecc71]" /> Financial Strategy Synthesis
              </h4>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-[#2ecc71]/20 border-t-[#2ecc71] animate-spin rounded-none" />
                  </div>
                  <p className="text-xs text-[#2ecc71] font-mono animate-pulse">
                    Gemini financial advisor analyzing country work regulations & costs...
                  </p>
                </div>
              ) : report ? (
                <div className="flex-1 overflow-y-auto pr-1 max-h-[500px]">
                  <div className="markdown-body font-mono text-xs text-stone-200 leading-relaxed space-y-3">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
