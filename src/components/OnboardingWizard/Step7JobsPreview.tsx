import React, { useEffect, useMemo } from 'react';
import { useOnboarding, StudentJobEntry } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { Briefcase, AlertCircle, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../../utils/sound';

export default function Step7JobsPreview() {
  const onboarding = useOnboarding();
  const { convertAmount } = useTheme();

  // Retrieve job options for target country or default to US
  const countryJobs: StudentJobEntry[] = useMemo(() => {
    return onboarding.jobsData[onboarding.targetCountry] || 
           onboarding.jobsData['United States'] || 
           [
             {
               title: "Retail Associate / Store Clerk",
               hourlyWage: 13,
               weeklyHourLimit: 20,
               estimatedMonthlyEarnings: 1100,
               taxDeductionPercent: 10,
               visaRestrictions: "20 hours per week during semester, full-time during breaks.",
               typicalEmployers: "Supermarkets, Bookstores, Mall Outlets",
               type: "Standard"
             },
             {
               title: "Campus Library Assistant",
               hourlyWage: 15,
               weeklyHourLimit: 20,
               estimatedMonthlyEarnings: 1200,
               taxDeductionPercent: 0,
               visaRestrictions: "On-campus employment allowed without additional work permit.",
               typicalEmployers: "University Library, IT Lab Centers",
               type: "On-Campus"
             },
             {
               title: "Academic Tutor (STEM or Languages)",
               hourlyWage: 18,
               weeklyHourLimit: 15,
               estimatedMonthlyEarnings: 1000,
               taxDeductionPercent: 5,
               visaRestrictions: "Standard 20 hours limit. Often freelance rules apply.",
               typicalEmployers: "Online, Tutoring Centers, Peer Tutoring",
               type: "Academic"
             }
           ];
  }, [onboarding.jobsData, onboarding.targetCountry]);

  // Sync selected index when country jobs list loads or changes
  useEffect(() => {
    if (countryJobs.length > 0 && onboarding.selectedJobIndex < 0) {
      onboarding.setSelectedJobIndex(0);
    }
  }, [countryJobs, onboarding]);

  const activeJob = countryJobs[onboarding.selectedJobIndex] || countryJobs[0];

  return (
    <div className="space-y-4 font-mono text-xs" id="wizard-step7">
      
      {/* Header Panel */}
      <div className="flex items-center gap-2 pb-2 border-b border-black">
        <Briefcase className="w-5 h-5 text-cyan-400" />
        <h4 className="font-press text-[9.5px] text-cyan-400 mc-text-shadow uppercase">
          7. Job Market & Work Forecast
        </h4>
      </div>

      <p className="text-stone-300 text-xs leading-relaxed">
        International student visas in <strong className="text-[#ffff55]">{onboarding.targetCountry}</strong> usually restrict work to a maximum of **20 hours per week** during study semesters. Select a target student job sector to estimate your net monthly wage and support your study goals.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        
        {/* Job selector list */}
        <div className="lg:col-span-6 space-y-3">
          <span className="font-bold text-[#ffaa00] text-[9.5px] block uppercase pb-1 border-b border-stone-850">
            💼 Student Job Profiles
          </span>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {countryJobs.map((job, idx) => {
              const isSelected = onboarding.selectedJobIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    playClickSound();
                    onboarding.setSelectedJobIndex(idx);
                    onboarding.setCustomHourlyWage(job.hourlyWage);
                  }}
                  className={`border-2 p-3 text-left cursor-pointer transition-all select-none ${
                    isSelected 
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200' 
                      : 'bg-stone-900 border-black text-stone-300 hover:border-stone-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-bold text-[10.5px] block truncate max-w-[70%]">{job.title}</span>
                    <span className="bg-black/55 border border-cyan-800 text-[10px] px-1.5 py-0.5 font-bold text-cyan-400 shrink-0">
                      {convertAmount(job.hourlyWage)}/hr
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Typical Employers:</span>
                      <span className="text-stone-300">{job.typicalEmployers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sector Category:</span>
                      <span className="text-stone-300">{job.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live paycheck stub calculations */}
        <div className="lg:col-span-6 bg-[#12181a] p-4.5 border-2 border-cyan-950 space-y-3.5">
          <span className="font-press text-[8px] text-cyan-400 uppercase block mc-text-shadow">
            📑 Part-Time Paystub Ledger
          </span>

          {activeJob ? (
            <div className="space-y-3">
              {/* Working hours sliders */}
              <div className="bg-black/40 p-3 border border-stone-850 space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-stone-300">Set Weekly Work Hours:</span>
                  <span className="text-cyan-400">{onboarding.hoursPerWeek} hrs / week</span>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max={activeJob.weeklyHourLimit || 20} 
                  step="1"
                  value={onboarding.hoursPerWeek} 
                  onChange={(e) => onboarding.setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-stone-900 h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-stone-500 uppercase">
                  <span>Min (4h)</span>
                  <span className="text-red-400 font-bold">Sem Limit ({activeJob.weeklyHourLimit || 20}h)</span>
                </div>
              </div>

              {/* Wage calculations */}
              <div className="space-y-2 border-b border-stone-850 pb-2 text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-stone-400">Selected hourly wage:</span>
                  <span className="text-stone-200">{convertAmount(onboarding.customHourlyWage)} / hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400 font-semibold">Gross Monthly Salary:</span>
                  <span className="text-stone-200 font-semibold">{convertAmount(onboarding.monthlyGrossWage)} / mo</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Est. Income Tax deductions:</span>
                  <span>-{convertAmount((onboarding.estimatedYearlyTax / 12))} / mo</span>
                </div>
                <div className="flex justify-between text-red-400">
                  <span>Social Contributions & Pensions:</span>
                  <span>-{convertAmount((onboarding.estimatedYearlySocial / 12))} / mo</span>
                </div>
                <div className="border-t border-dashed border-stone-800 pt-1.5 flex justify-between font-bold text-cyan-400 text-[11px]">
                  <span>NET ESTIMATED PAYCHECK:</span>
                  <span>+{convertAmount(onboarding.monthlyNetWage)} / mo</span>
                </div>
              </div>

              {/* Impact on Savings */}
              <div className="bg-black/50 p-2.5 border border-stone-850 text-center text-[10px] space-y-1">
                <span className="text-stone-400 font-bold block uppercase text-[8px]">Net Scriptor Savings impact:</span>
                <p className="text-stone-300">
                  This job improves your net monthly savings margin to{' '}
                  <strong className={`font-semibold ${onboarding.monthlySavings >= 0 ? "text-[#55ff55]" : "text-red-400"}`}>
                    {onboarding.monthlySavings >= 0 ? "+" : ""}{convertAmount(onboarding.monthlySavings)}/mo
                  </strong>.
                </p>
              </div>

            </div>
          ) : (
            <div className="italic text-stone-500 py-10 text-center">
              No active job profile chosen. Select a profile to trigger calculation sheets.
            </div>
          )}
        </div>

      </div>

      {/* Warnings & Legal terms banner */}
      <div className="p-3 bg-stone-900/40 border border-stone-800 flex items-start gap-2.5 mt-2">
        <ShieldAlert className="w-4.5 h-4.5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-stone-300 text-[10px]">
          <strong className="text-[#ffff55] uppercase block text-[8.5px]">Visa Regulations Advisory</strong>
          <span>
            {activeJob?.visaRestrictions || "All international students must maintain full-time study enrollment status to satisfy visa guidelines. Off-campus roles often require special authorization certificates."}
          </span>
        </div>
      </div>

    </div>
  );
}
