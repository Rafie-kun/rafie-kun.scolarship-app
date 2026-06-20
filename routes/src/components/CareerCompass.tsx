import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Compass, Filter, Sparkles, BookOpen, ExternalLink, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playClickSound } from '../utils/sound';

interface Job {
  id: string;
  title: string;
  industry: string;
  averagePay: string;
  type: 'part-time' | 'full-time' | 'internship';
  country: string;
  tips: string;
}

/**
 * 🧭 CareerCompass - Recommends part-time student employment, campus roles,
 * and internships based on current student profile data (intended major and target country).
 */
export default function CareerCompass() {
  const { profile, authorizedFetch } = useAuth();
  const { convertAmount, themeMode } = useTheme();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [customSearch, setCustomSearch] = useState<string>('');
  const [autoFilter, setAutoFilter] = useState<boolean>(true); // Auto-match to profile major/country

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await authorizedFetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          setJobs(data || []);
        } else {
          setError("Failed to consult career Oracle indices.");
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Network error contacting career portal database.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const handleToggleAuto = () => {
    playClickSound();
    setAutoFilter(!autoFilter);
  };

  const handleTypeChange = (type: string) => {
    playClickSound();
    setFilterType(type);
  };

  const handleCountryChange = (country: string) => {
    playClickSound();
    setFilterCountry(country);
  };

  // Heuristic matching helper: searches for keywords between major & job title/industry
  const isMajorMatch = (intendedMajor: string, job: Job): boolean => {
    if (!intendedMajor) return true;
    const m = intendedMajor.toLowerCase();
    const t = job.title.toLowerCase();
    const ind = job.industry.toLowerCase();

    // Match computer science, IT, software engineering, coding
    if (m.includes('computer') || m.includes('code') || m.includes('software') || m.includes('tech') || m.includes('data') || m.includes('information')) {
      return (
        t.includes('it') || t.includes('develop') || t.includes('coder') || t.includes('tech') ||
        t.includes('software') || t.includes('database') || t.includes('python') || t.includes('comput') ||
        t.includes('web') || t.includes('cloud') || ind.includes('technology') || ind.includes('software') || ind.includes('data') || ind.includes('security')
      );
    }
    // Match finance, business, marketing
    if (m.includes('business') || m.includes('market') || m.includes('finance') || m.includes('account') || m.includes('econ')) {
      return (
        t.includes('business') || t.includes('market') || t.includes('creative') || t.includes('data') ||
        t.includes('account') || t.includes('bookkeeper') || t.includes('curator') || ind.includes('business') || ind.includes('marketing')
      );
    }
    // Match humanities, languages, art, writing
    if (m.includes('english') || m.includes('write') || m.includes('art') || m.includes('language') || m.includes('history')) {
      return (
        t.includes('write') || t.includes('english') || t.includes('illustration') || t.includes('design') ||
        t.includes('illustrator') || t.includes('translat') || ind.includes('writing') || ind.includes('design') || ind.includes('education')
      );
    }
    return true; // fallback to general matching
  };

  // Helper to parse pay and render with proper currency conversion hook
  const renderConvertedPay = (payStr: string) => {
    // Tries to find numbers in the pay string like "$18 / Hr" or "€1,600 / Mo"
    const numbersOnly = payStr.replace(/[^0-9]/g, '');
    if (!numbersOnly) return payStr; // Fallback if no digits (e.g. "Free Housing")
    
    const parsedNum = parseInt(numbersOnly);
    if (isNaN(parsedNum)) return payStr;

    // Convert from estimated base currency
    let baseInUSD = parsedNum;
    if (payStr.includes('€')) {
      baseInUSD = parsedNum / 0.92;
    } else if (payStr.includes('£')) {
      baseInUSD = parsedNum / 0.79;
    } else if (payStr.includes('BDT') || payStr.includes('৳')) {
      baseInUSD = parsedNum / 117.5;
    }

    const suffix = payStr.toLowerCase().includes('mo') ? ' / Mo' : payStr.toLowerCase().includes('hr') ? ' / Hr' : '';
    return `${convertAmount(baseInUSD)}${suffix}`;
  };

  // Perform filtering
  const filteredJobs = jobs.filter(job => {
    // 1. Career Auto-matching heuristic with User Profile
    if (autoFilter && profile) {
      const matchMajor = isMajorMatch(profile.primaryMajor || profile.intendedMajor || '', job);
      const matchCountry = !profile.country || job.country.toLowerCase() === 'worldwide' || job.country.toLowerCase() === profile.country.toLowerCase();
      if (!matchMajor || !matchCountry) return false;
    }

    // 2. Job Type filter
    if (filterType !== 'all' && job.type !== filterType) return false;

    // 3. Country filter
    if (filterCountry !== 'all') {
      if (filterCountry === 'Worldwide' && job.country.toLowerCase() !== 'worldwide') return false;
      if (filterCountry !== 'Worldwide' && job.country.toLowerCase() !== filterCountry.toLowerCase()) return false;
    }

    // 4. Custom search filter
    if (customSearch.trim()) {
      const s = customSearch.toLowerCase();
      return (
        job.title.toLowerCase().includes(s) ||
        job.industry.toLowerCase().includes(s) ||
        job.country.toLowerCase().includes(s) ||
        job.tips.toLowerCase().includes(s)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Visual Header Grid Panel */}
      <div className="bg-[#2c2927] border-4 border-black p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Briefcase className="w-48 h-48 text-[#ffff55]" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-[#ffff55] animate-spin-slow" />
              <h1 className="font-press text-[16px] text-[#ffff55] mc-text-shadow uppercase tracking-wider">
                Career Compass
              </h1>
            </div>
            <p className="text-stone-400 font-mono text-xs max-w-2xl leading-relaxed">
              Explore dynamic part-time slots, campus jobs, and professional summer internship blueprints specifically indexed to match your <span className="text-[#55ffff] font-bold">Major</span> and <span className="text-[#55ffff] font-bold">Target Countries</span>.
            </p>
          </div>
          
          {/* Autofilter Match Pill Toggle button */}
          <button
            onClick={handleToggleAuto}
            className={`mc-btn p-3 px-4 flex items-center gap-2 text-[10px] font-press uppercase cursor-pointer ${
              autoFilter ? 'text-[#55ff55] bg-green-950/20 border-[#55ff55]' : 'text-stone-400 border-black'
            }`}
          >
            <Sparkles className={`w-4.5 h-4.5 ${autoFilter ? 'animate-bounce text-[#55ff55]' : ''}`} />
            {autoFilter ? 'Auto-Matching Active' : 'Show All Career Slots'}
          </button>
        </div>
      </div>

      {/* Control panel and filters section */}
      <div className="bg-stone-900 border-4 border-black p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input bar */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Search roles, keywords, skills..."
            value={customSearch}
            onChange={(e) => setCustomSearch(e.target.value)}
            className="w-full bg-[#110f0d] border-2 border-black p-3 text-stone-200 font-sans text-xs focus:outline-none focus:border-[#ffff55]"
          />
        </div>

        {/* Type selector */}
        <div>
          <select
            value={filterType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full bg-[#110f0d] border-2 border-black p-3 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#ffff55] h-10.5"
          >
            <option value="all">🕒 All Contract-Types</option>
            <option value="part-time">Part-Time Jobs</option>
            <option value="internship">Internships</option>
          </select>
        </div>

        {/* Country selector */}
        <div>
          <select
            value={filterCountry}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full bg-[#110f0d] border-2 border-black p-3 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#ffff55] h-10.5"
          >
            <option value="all">🌍 All Hubs</option>
            <option value="worldwide">Worldwide / Remote</option>
            <option value="USA">United States</option>
            <option value="Germany">Germany</option>
            <option value="UK">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Bangladesh">Bangladesh</option>
          </select>
        </div>
      </div>

      {autoFilter && profile && (
        <div className="bg-black/40 border-2 border-[#1b1918] p-3 text-xs font-mono text-[#55ffff] flex items-center gap-2">
          <BookOpen className="w-4.5 h-4.5" />
          <span>Active matching vectors: <strong>{profile.primaryMajor || profile.intendedMajor || 'None'}</strong> · country: <strong>{profile.country || 'Any'}</strong></span>
        </div>
      )}

      {/* Main Grid display area */}
      {loading ? (
        <div className="py-24 text-center font-press text-[10px] text-[#ffff55] animate-pulse space-y-2">
          <Compass className="w-8 h-8 mx-auto animate-spin" />
          <span>SCANNING LABOUR OPPORTUNITIES...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border-4 border-red-900/60 p-6 text-center text-red-400 font-mono text-xs">
          🚫 {error}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-[#1a1817] border-4 border-black p-12 text-center rounded-none space-y-4">
          <Briefcase className="w-12 h-12 text-stone-600 mx-auto opacity-50" />
          <h2 className="font-mono font-bold text-stone-400 text-sm">NO CAREER SLOTS DISCOVERED Matrix</h2>
          <p className="text-stone-500 font-sans text-xs max-w-md mx-auto">
            Try switching off 'Auto-Matching Active' above or widening the search strings to view all jobs globally.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-[#2c2927] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] hover:border-[#ffff55] transition-all flex flex-col justify-between group space-y-4 relative`}
            >
              {/* Badge tags heading */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase bg-black/40 text-[#55ffff] border border-[#55ffff]/30 px-2.5 py-0.5 font-bold tracking-widest whitespace-nowrap">
                    {job.type}
                  </span>
                  <h3 className="font-sans font-bold text-stone-100 text-sm group-hover:text-[#ffff55] transition-colors leading-snug">
                    {job.title}
                  </h3>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-mono font-bold text-[#ffff55]">
                    {renderConvertedPay(job.averagePay)}
                  </div>
                  <span className="text-[9px] font-mono text-stone-500 uppercase">{job.industry}</span>
                </div>
              </div>

              {/* Tips & metadata sector */}
              <div className="bg-black/35 border border-[#141414] p-3 text-xs space-y-2 font-mono text-stone-300">
                <div className="flex items-center gap-1.5 text-[#55ff55]">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Expert Advice:</span>
                </div>
                <p className="text-stone-300 font-sans text-[11.5px] leading-relaxed">
                  {job.tips}
                </p>
              </div>

              {/* Apply link bar */}
              <div className="flex items-center justify-between pt-1 border-t-2 border-black/30">
                <div className="flex items-center gap-1 text-stone-400 text-xs">
                  <MapPin className="w-4 h-4 text-stone-500" />
                  <span>{job.country}</span>
                </div>
                
                <button
                  onClick={() => {
                    playClickSound();
                    alert(`Routing application query to corresponding campus board for: "${job.title}"! Please secure your cover letter in the Scroll Vault.`);
                  }}
                  className="mc-btn font-press text-[8px] py-2 px-3 text-[#ffff55] flex items-center gap-1 uppercase cursor-pointer"
                >
                  Apply Slot <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
