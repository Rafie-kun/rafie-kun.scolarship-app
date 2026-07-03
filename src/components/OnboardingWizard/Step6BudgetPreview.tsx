import React from 'react';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { Coins, AlertTriangle, ShieldCheck, Home, Utensils, Bus, Shield, BookOpen } from 'lucide-react';
import { playClickSound } from '../../utils/sound';

export default function Step6BudgetPreview() {
  const onboarding = useOnboarding();
  const { convertAmount, themeMode } = useTheme();

  const isDeficit = onboarding.monthlySavings < 0;

  return (
    <div className="space-y-4 font-mono text-xs" id="wizard-step6">
      
      {/* Header Panel */}
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Coins className="w-5 h-5 text-red-400" />
        <h4 className="font-press text-[9.5px] text-red-400 mc-text-shadow uppercase">
          6. Living & Budget Preview
        </h4>
      </div>

      <p className="text-stone-300 text-xs leading-relaxed">
        Let's audit the estimated living costs in your selected target land: <strong className="text-[#ffff55]">{onboarding.targetCountry}</strong>. Use the sliders to customize your expectations and balance your monthly scribe.
      </p>

      {/* Grid with Config Sliders & Live calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        
        {/* Sliders override */}
        <div className="lg:col-span-7 bg-black/30 p-4 border border-stone-800 space-y-4">
          <span className="font-bold text-[#ffaa00] text-[9.5px] block uppercase pb-1 border-b border-stone-850">
            📊 Customize Expected Expenses
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rent Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[8.5px]">Rent & Flatshare:</span>
                <span className="text-[#ffff55]">{convertAmount(onboarding.rent)}/mo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2500" 
                step="20"
                value={onboarding.rent} 
                onChange={(e) => onboarding.setRent(Number(e.target.value))}
                className="w-full accent-red-500 bg-stone-900 h-1.5 cursor-pointer"
              />
            </div>

            {/* Food Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[8.5px]">Groceries & Meals:</span>
                <span className="text-[#ffff55]">{convertAmount(onboarding.food)}/mo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                step="10"
                value={onboarding.food} 
                onChange={(e) => onboarding.setFood(Number(e.target.value))}
                className="w-full accent-red-500 bg-stone-900 h-1.5 cursor-pointer"
              />
            </div>

            {/* Local Transit Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[8.5px]">Local Transit Card:</span>
                <span className="text-[#ffff55]">{convertAmount(onboarding.transport)}/mo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="400" 
                step="5"
                value={onboarding.transport} 
                onChange={(e) => onboarding.setTransport(Number(e.target.value))}
                className="w-full accent-red-500 bg-stone-900 h-1.5 cursor-pointer"
              />
            </div>

            {/* Insurance Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[8.5px]">Health Insurance:</span>
                <span className="text-[#ffff55]">{convertAmount(onboarding.insurance)}/mo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="500" 
                step="5"
                value={onboarding.insurance} 
                onChange={(e) => onboarding.setInsurance(Number(e.target.value))}
                className="w-full accent-red-500 bg-stone-900 h-1.5 cursor-pointer"
              />
            </div>

            {/* Miscellaneous pocket */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex justify-between">
                <span className="text-stone-400 font-bold uppercase text-[8.5px]">Miscellaneous / Books:</span>
                <span className="text-[#ffff55]">{convertAmount(onboarding.misc)}/mo</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="600" 
                step="10"
                value={onboarding.misc} 
                onChange={(e) => onboarding.setMisc(Number(e.target.value))}
                className="w-full accent-red-500 bg-stone-900 h-1.5 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-stone-950 p-2.5 text-stone-400 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5 text-stone-300 font-bold uppercase text-[8px] mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Target Universities estimated tuition:
            </div>
            {onboarding.recommendedTargetUnis.length > 0 ? (
              onboarding.recommendedTargetUnis.map(uni => (
                <div key={uni.id} className="flex justify-between">
                  <span>{uni.name}:</span>
                  <span className="text-stone-300 font-semibold">{convertAmount(uni.tuitionMin)} - {convertAmount(uni.tuitionMax)} / yr</span>
                </div>
              ))
            ) : (
              <span className="italic block text-stone-500">No estimated local universities in databases for {onboarding.targetCountry}.</span>
            )}
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="lg:col-span-5 bg-[#1a1412] p-4.5 border-2 border-black space-y-4 [box-shadow:inset_-2px_-2px_0_#111,inset_2px_2px_0_#444]">
          <span className="font-press text-[8px] text-[#55ff55] uppercase block mc-text-shadow">
            💸 Monthly Financial Ledger
          </span>

          <div className="space-y-2 text-[11px] border-b border-stone-800 pb-3">
            <div className="flex justify-between">
              <span className="text-stone-400">Scholarship / Stipends:</span>
              <span className="text-stone-200">+{convertAmount(onboarding.stipend)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Net Job Income:</span>
              <span className="text-stone-200">+{convertAmount(onboarding.monthlyNetWage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Other Support:</span>
              <span className="text-stone-200">+{convertAmount(onboarding.otherIncome)}</span>
            </div>
            <div className="border-t border-dashed border-stone-800 pt-1.5 flex justify-between font-bold text-[#55ff55]">
              <span>TOTAL REVENUE:</span>
              <span>+{convertAmount(onboarding.totalMonthlyIncome)}/mo</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] border-b border-stone-800 pb-3">
            <div className="flex justify-between text-stone-400">
              <span>Rent & Utilities:</span>
              <span>-{convertAmount(onboarding.rent)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Subsistence & Food:</span>
              <span>-{convertAmount(onboarding.food)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Transit & Insurance:</span>
              <span>-{convertAmount(onboarding.transport + onboarding.insurance)}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Misc Allowance:</span>
              <span>-{convertAmount(onboarding.misc)}</span>
            </div>
            <div className="border-t border-dashed border-stone-800 pt-1.5 flex justify-between font-bold text-red-400">
              <span>TOTAL ESTIMATED EXPENSES:</span>
              <span>-{convertAmount(onboarding.totalMonthlyExpenses)}/mo</span>
            </div>
          </div>

          <div className="bg-black/50 p-3.5 border border-stone-850 space-y-2 text-center">
            <span className="text-stone-500 uppercase text-[8px] font-bold block">Estimated Scribe Balance</span>
            <span className={`font-press text-[14px] block mc-text-shadow ${isDeficit ? "text-red-500 animate-pulse" : "text-[#ffff55]"}`}>
              {isDeficit ? "-" : "+"}{convertAmount(Math.abs(onboarding.monthlySavings))} / mo
            </span>
            <span className="text-[9px] text-stone-400 block font-mono">
              {isDeficit ? "⚠️ TREASURY DEFICIT REPORTED!" : "✅ BALANCED LEDGER METRIC!"}
            </span>
          </div>
        </div>

      </div>

      {/* Warnings & Compliance check footer block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-stone-900/50 border border-stone-800 flex items-center gap-2.5">
          {isDeficit ? (
            <>
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <strong className="text-red-400 uppercase text-[9px] block">Treasury Warning</strong>
                Your expenses exceed monthly income. Try setting up a part-time student job in the next step!
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-[#55ff55] shrink-0" />
              <div>
                <strong className="text-[#55ff55] uppercase text-[9px] block">Balanced Budget</strong>
                Your expected stipend or parental contributions fully cover estimated cost of living matrices.
              </div>
            </>
          )}
        </div>

        <div className="p-3 bg-stone-900/50 border border-stone-800 flex items-center gap-2.5">
          <Coins className="w-5 h-5 text-yellow-500 shrink-0" />
          <div>
            <strong className="text-[#ffff55] uppercase text-[9px] block">Taxes Exemptions</strong>
            Working students earning under general thresholds enjoy 0% income tax rates in {onboarding.targetCountry}.
          </div>
        </div>
      </div>

    </div>
  );
}
