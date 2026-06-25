import React, { useState, useEffect } from 'react';
import { School, MapPin, Coins, Award, Sparkles, Search, SlidersHorizontal, Check, Home, Building2, HelpCircle } from 'lucide-react';
import { University, Profile } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCleanUniversityUrl } from '../utils/urlHelper';

interface RecommendedUni {
  university: University;
  matchScore: number;
  reasoning: string;
}

export default function UniversitiesView() {
  const { profile, authorizedFetch } = useAuth();
  const { convertAmount, currency, setCurrency } = useTheme();
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'recommender'>('all');

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [type, setType] = useState('all');
  const [sortBy, setSortBy] = useState('ranking_asc');
  const [housingFilter, setHousingFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Database lists
  const [unis, setUnis] = useState<University[]>([]);
  const [recommendedUnis, setRecommendedUnis] = useState<RecommendedUni[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Recommendations configuration
  const [rankMax, setRankMax] = useState(500);
  const [tuitionMax, setTuitionMax] = useState(65000);
  const [recType, setRecType] = useState('all');
  const [recHousing, setRecHousing] = useState(false);
  
  // Specific detail modal
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Load all universities
  const fetchAllUnis = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (country !== 'all') params.append('country', country);
      if (type !== 'all') params.append('type', type);
      if (housingFilter) params.append('onCampusHousing', 'true');
      params.append('sortBy', sortBy);
      params.append('page', String(page));
      params.append('limit', String(limit));

      let data: any = { universities: [], totalPages: 1, total: 0 };
      try {
        const res = await fetch(`/api/universities?${params.toString()}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn("API failed, using fallback:", err);
      }

      if (!data.universities || data.universities.length === 0) {
        const fallbackRes = await fetch('/data/universities.json');
        if (fallbackRes.ok) {
          const allUnis = await fallbackRes.json();
          // Basic client side filtering as fallback
          let filtered = allUnis;
          if (search) filtered = filtered.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()) || u.city.toLowerCase().includes(search.toLowerCase()));
          if (country !== 'all') filtered = filtered.filter((u: any) => u.country.toLowerCase() === country.toLowerCase());
          if (type !== 'all') filtered = filtered.filter((u: any) => u.type === type);
          if (housingFilter) filtered = filtered.filter((u: any) => u.hasOnCampusHousing);
          
          data.total = filtered.length;
          data.totalPages = Math.ceil(filtered.length / limit);
          const startIndex = (page - 1) * limit;
          data.universities = filtered.slice(startIndex, startIndex + limit);
        }
      }

      setUnis(data.universities || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch universities grid:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load recommended universities
  const fetchRecommendedUnis = async () => {
    setRecLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('ranking_max', String(rankMax));
      params.append('tuition_max', String(tuitionMax));
      params.append('type', recType);
      if (recHousing) params.append('on_campus_housing', 'true');

      let recs: any[] = [];
      try {
        const res = await authorizedFetch(`/api/best-universities?${params.toString()}`);
        if (res.ok) {
          recs = await res.json();
        }
      } catch (err) {
        console.warn("Best universities API failed, using fallback:", err);
      }

      if (!recs || recs.length === 0) {
        const fallbackRes = await fetch('/data/universities.json');
        if (fallbackRes.ok) {
          const allUnis = await fallbackRes.json();
          const filtered = allUnis.filter((u: any) => 
            u.ranking <= rankMax && 
            (tuitionMax >= 65000 || u.tuitionMax <= tuitionMax) &&
            (recType === 'all' || u.type === recType) &&
            (!recHousing || u.hasOnCampusHousing)
          );
          recs = filtered.slice(0, 10).map((u: any, idx: number) => ({
            university: u,
            matchScore: Math.floor(80 + Math.random() * 20),
            reasoning: "Static fallback recommendation logic applied."
          }));
        }
      }

      setRecommendedUnis(recs || []);
    } catch (err) {
      console.error("Failed to fetch university recommendations:", err);
    } finally {
      setRecLoading(false);
    }
  };

  // Run searches
  useEffect(() => {
    if (activeSubTab === 'all') {
      fetchAllUnis();
    } else {
      fetchRecommendedUnis();
    }
  }, [search, country, type, sortBy, housingFilter, activeSubTab, page, limit]);

  // Handle recommender updates
  const handleApplyRecFilters = () => {
    playAdvancementSound();
    fetchRecommendedUnis();
  };

  const countriesList = [
    { value: 'all', label: 'All Lands' },
    { value: 'usa', label: 'United States' },
    { value: 'united kingdom', label: 'United Kingdom' },
    { value: 'germany', label: 'Germany' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'switzerland', label: 'Switzerland' },
    { value: 'sweden', label: 'Sweden' },
    { value: 'italy', label: 'Italy' },
    { value: 'finland', label: 'Finland' },
    { value: 'south korea', label: 'South Korea' }
  ];

  return (
    <div className="space-y-6" id="scholarpath-universities-view">
      
      {/* Page Title Block */}
      <div className="mc-window-dark border-4 border-black text-stone-200">
        <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
          <School className="w-5 h-5 text-[#ffff55]" /> TARGET KEEPS (UNIVERSITIES PORTAL)
        </h3>
        <p className="text-xs text-stone-350 font-mono mt-2">
          Explore elite global academies, benchmark admittance GPAs, calculate tuition rates, and unlock custom AI-matched recommendation criteria based on your active stats.
        </p>
      </div>

      {/* Currency Selector Toggle Toggle bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 border-4 border-black p-3 font-mono text-xs text-stone-300">
        <div className="flex items-center gap-1.5 label text-[10px] font-press uppercase text-stone-400">
          <Coins className="w-4 h-4 text-[#ffff55]" /> Currency Standard:
        </div>
        <div className="flex gap-1.5">
          {(['USD', 'EUR', 'GBP', 'BDT'] as const).map((curr) => (
            <button
              key={`curr-toggle-${curr}`}
              onClick={() => { playClickSound(); setCurrency(curr); }}
              className={`px-3 py-1 font-mono text-[11px] font-bold border-2 ${
                currency === curr
                  ? 'bg-[#ffff55] border-black text-black'
                  : 'bg-[#141414] border-stone-800 text-stone-300 hover:border-[#ffff55] cursor-pointer'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex gap-2">
        <button
          onClick={() => { playClickSound(); setActiveSubTab('all'); }}
          className={`px-4 py-2 font-press text-[9px] uppercase border-4 border-black text-shadow ${
            activeSubTab === 'all' 
              ? 'bg-[#3b3b8c] text-[#ffff55] border-t-[#c9c9ff] border-left-[#c9c9ff]' 
              : 'bg-[#555] text-stone-300'
          }`}
        >
          🏰 All Target Keeps ({unis.length})
        </button>
        <button
          onClick={() => { playClickSound(); setActiveSubTab('recommender'); fetchRecommendedUnis(); }}
          className={`px-4 py-2 font-press text-[9px] uppercase border-4 border-black text-shadow ${
            activeSubTab === 'recommender' 
              ? 'bg-[#3b3b8c] text-[#ffff55] border-t-[#c9c9ff] border-left-[#c9c9ff]' 
              : 'bg-[#555] text-stone-300'
          }`}
        >
          🔮 Personalized Best Keeps for You
        </button>
      </div>

      {/* RENDER TAB 1: ALL UNIVERSITIES GRID WITH SEARCH FILTERS */}
      {activeSubTab === 'all' && (
        <div className="space-y-4">
          
          {/* Quick Search Controls */}
          <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Query Name, Major, or Location City..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/45 border-4 border-stone-800 text-stone-200 pl-10 pr-4 py-2 text-xs font-mono focus:border-[#ffff55] outline-none"
                />
              </div>

              <button
                onClick={() => { playClickSound(); setShowFilters(!showFilters); }}
                className="mc-btn flex items-center gap-1.5 shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced Matrix
              </button>
            </div>

            {/* Advanced Filters Expandable Drawer */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3.5 bg-black/30 border-2 border-dashed border-stone-800">
                
                {/* Country List Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-press text-stone-400 block uppercase">Land Zone:</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#3a3a3a] border-2 border-black text-stone-200 text-xs font-mono p-1 select-none"
                  >
                    {countriesList.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Institution Type Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-press text-stone-400 block uppercase">Academy Class:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#3a3a3a] border-2 border-black text-stone-200 text-xs font-mono p-1"
                  >
                    <option value="all">All structures</option>
                    <option value="public">Public Node (No fee fallback)</option>
                    <option value="private">Private Elite Keep</option>
                  </select>
                </div>

                {/* Sort algorithm */}
                <div className="space-y-1">
                  <label className="text-[10px] font-press text-stone-400 block uppercase">Sort Indices:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-[#3a3a3a] border-2 border-black text-stone-200 text-xs font-mono p-1"
                  >
                    <option value="ranking_asc">Global Rank # (Best first)</option>
                    <option value="tuition_asc">Tuition Rate (Lowest first)</option>
                    <option value="tuition_desc">Tuition Rate (Highest first)</option>
                    <option value="gpa_desc">Required GPA (Competitive first)</option>
                    <option value="alphabetical">Keeps A-Z</option>
                  </select>
                </div>

                {/* Housing toggle */}
                <div className="flex items-center gap-2 pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setHousingFilter(!housingFilter); }}
                    className={`w-6 h-6 border-2 border-black mc-slot flex items-center justify-center ${housingFilter ? 'active' : ''}`}
                  >
                    {housingFilter && <Check className="w-4 h-4 text-[#ffff55]" />}
                  </button>
                  <span className="text-xs font-mono text-stone-300">On Campus Dorms Only</span>
                </div>

              </div>
            )}
          </div>

          {/* Cards Loading Status */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
              <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
              <span className="mc-text-shadow">POLLING ADMISSIONS DATAGRID...</span>
            </div>
          ) : unis.length === 0 ? (
            <div className="p-12 text-center bg-[#2c2c2c] border-4 border-black font-press text-[10px] text-stone-400">
              No strongholds matched your query matrices. Clear search filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {unis.map((uni) => (
                <div 
                  key={uni.id}
                  className="bg-[#2c2c2c] border-4 border-black p-5 rounded-none flex flex-col justify-between hover:border-[#ffff55] transition-all [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#3e3e3e] pb-2.5">
                      <span className="font-press text-[9px] text-[#64e3ff] mc-text-shadow">QS GLOBAL #{uni.ranking}</span>
                      <span className="text-[10px] font-mono text-[#ffff55] bg-black/40 px-2.5 py-0.5 border border-[#ffff55]/30 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ff5555]" /> {uni.country}
                      </span>
                    </div>

                    <h4 className="font-press text-[11px] leading-normal text-stone-100 min-h-[44px] flex items-center">{uni.name}</h4>
                    
                    {/* Key characteristics tags */}
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border border-black ${uni.type === 'public' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>
                        🔑 {uni.type}
                      </span>
                      {uni.hasOnCampusHousing && (
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-blue-950 text-blue-300 border border-black flex items-center gap-0.5">
                          <Home className="w-3 h-3" /> Dorms
                        </span>
                      )}
                      <span className="text-[9px] font-mono bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5">
                        📍 {uni.city}
                      </span>
                    </div>

                    {/* Quick values box */}
                    <div className="space-y-1.5 text-xs font-mono pt-3 border-t border-[#3e3e3e] bg-black/35 p-3 rounded-none border border-black">
                      <div className="flex justify-between">
                        <span className="text-stone-400 text-[11px]">Admissions Rate:</span>
                        <span className="font-bold text-[#55ff55]">{uni.acceptanceRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400 text-[11px]">Target GPA Limit:</span>
                        <span className="font-bold text-[#ffaa00]">{(uni.averageGpa ?? 3.0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400 text-[11px]">Est. Annual Tuition:</span>
                        <span className="font-bold text-[#ffff55] flex items-center gap-0.5 truncate max-w-lg" title={`$${uni.tuitionMin.toLocaleString()} - $${uni.tuitionMax.toLocaleString()}`}>
                          <Coins className="w-3.5 h-3.5 text-[#ffaa00] shrink-0" /> 
                          {uni.tuitionMin === 0 ? "Free / Public" : `${convertAmount(uni.tuitionMin)} - ${convertAmount(uni.tuitionMax)}`}
                        </span>
                      </div>
                    </div>

                    {/* Majors list */}
                    <div className="pt-2">
                      <span className="text-[9px] font-mono uppercase text-[#64e3ff] block mb-1">Strong Core Facilities:</span>
                      <div className="flex flex-wrap gap-1">
                        {uni.popularMajors?.slice(0, 3).map((major, i) => (
                          <span key={i} className="bg-stone-900 border border-stone-800 text-[10px] text-stone-300 px-1.5 py-0.5">
                            {major}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#3e3e3e] space-y-2">
                    <button
                      onClick={() => { playClickSound(); setSelectedUni(uni); }}
                      className="w-full mc-btn py-1.5 text-[8px] font-press tracking-wide uppercase text-[#ffff55]"
                    >
                      Inspect Dossier Blueprint
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          playClickSound();
                          window.open(getCleanUniversityUrl(uni, false), '_blank', 'noopener,noreferrer');
                        }}
                        className="flex-1 bg-stone-900 border-2 border-black hover:border-gray-500 text-stone-200 py-1 text-[8px] font-press uppercase cursor-pointer"
                        title="Launch Official Website"
                      >
                        🌐 Website
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          window.open(getCleanUniversityUrl(uni, true), '_blank', 'noopener,noreferrer');
                        }}
                        className="flex-1 bg-emerald-950 border-2 border-[#55ff55] hover:border-[#ffff55] text-[#55ff55] py-1 text-[8px] font-press uppercase cursor-pointer"
                        title="Launch Application/Apply Link"
                      >
                        📝 Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Advanced pagination footer with limit selector and show all */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#2c2c2c] border-4 border-black p-3.5 mt-6 gap-4 font-mono text-xs text-stone-300">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[11px]">
                  Revealed <span className="font-bold text-stone-200">{unis.length}</span> of <span className="font-bold text-stone-200">{totalItems}</span> matching strongholds
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-400">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      playClickSound();
                      const val = Number(e.target.value);
                      setLimit(val);
                      setPage(1);
                    }}
                    className="bg-[#141414] border-2 border-stone-800 text-stone-300 font-mono text-[11px] p-1 focus:outline-none"
                  >
                    <option value={6}>6 Strongholds</option>
                    <option value={12}>12 Strongholds</option>
                    <option value={24}>24 Strongholds</option>
                    <option value={60}>60 Slots (Show All)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => { playClickSound(); setPage(prev => Math.max(1, prev - 1)); }}
                  className="mc-btn px-2.5 py-1 text-[9px] uppercase disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => { playClickSound(); setPage(pIdx); }}
                    className={`px-2.5 py-1 text-[11px] font-bold border-2 ${
                      page === pIdx 
                        ? "bg-[#ffff55] border-black text-black" 
                        : "bg-[#141414] border-stone-800 text-stone-300 hover:border-[#ffff55]"
                    }`}
                  >
                    {pIdx}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => { playClickSound(); setPage(prev => Math.min(totalPages, prev + 1)); }}
                  className="mc-btn px-2.5 py-1 text-[9px] uppercase disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
          )}
        </div>
      )}

      {/* RENDER TAB 2: PERSONALIZED RECOMMENDER SECTION */}
      {activeSubTab === 'recommender' && (
        <div className="space-y-6">
          
          {/* Active stats overview card */}
          <div className="bg-[#4a2e22] border-4 border-black p-4 text-stone-200 [box-shadow:inset_-4px_-4px_0_#2b1a13,inset_4px_4px_0_#754c3a] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="font-press text-[9px] text-[#ffaa00] mc-text-shadow uppercase block">RECON COMPASS CALIBRATED STATS</span>
              <h4 className="font-press text-[13px] text-[#ffff55] mc-text-shadow truncate max-w-sm">{profile?.fullName}</h4>
              <p className="text-xs font-mono text-stone-300 pt-1">
                Active GPA: <span className="font-bold text-[#55ff55]">{(profile?.gpa ?? 0).toFixed(2)}</span> | Target Major: <span className="font-bold text-[#64e3ff]">{profile?.intendedMajor}</span> | Level: <span className="text-[#ffaa00] font-bold">{profile?.intendedDegree}</span>
              </p>
            </div>
            <div className="bg-black/45 border-2 border-black p-2 text-stone-300 text-xs font-mono text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[#64e3ff] font-bold block uppercase">Recommended Limits:</span>
              <span>Acceptance Ratio: competitive-high | Tuition: adjusted</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left sidebar widget for recommendation tuning parameters */}
            <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] lg:col-span-1">
              <h4 className="font-press text-[9px] text-stone-100 uppercase border-b border-stone-700 pb-2 flex items-center gap-1.5 leading-none">
                <SlidersHorizontal className="w-4 h-4 text-[#ffff55]" /> Filter Matrices
              </h4>

              {/* Slider 1: Ranking limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-stone-400">QS Rank Max:</span>
                  <span className="text-[#64e3ff] font-bold">#{rankMax}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1200"
                  step="10"
                  value={rankMax}
                  onChange={(e) => setRankMax(parseInt(e.target.value))}
                  className="w-full h-2 bg-stone-900 border border-black accent-[#3b3b8c]"
                />
              </div>

              {/* Slider 2: Tuition cap */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-stone-400">Tuition Cap/yr:</span>
                  <span className="text-[#ffff55] font-bold">
                    {tuitionMax === 0 ? "Free Only" : tuitionMax >= 65000 ? "Any cap" : `$${(tuitionMax/1000).toFixed(0)}k`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="65000"
                  step="1000"
                  value={tuitionMax}
                  onChange={(e) => setTuitionMax(parseInt(e.target.value))}
                  className="w-full h-2 bg-stone-900 border border-black accent-[#3b3b8c]"
                />
              </div>

              {/* Select 1: Keep Node Type */}
              <div className="space-y-1">
                <label className="text-[9px] font-press text-stone-400 block uppercase">Alliance Type:</label>
                <select
                  value={recType}
                  onChange={(e) => setRecType(e.target.value)}
                  className="w-full bg-[#3a3a3a] border-2 border-black text-stone-200 text-xs font-mono p-1"
                >
                  <option value="all">Any Structures</option>
                  <option value="public">Public (No-Fee emphasis)</option>
                  <option value="private">Private (Endowed focus)</option>
                </select>
              </div>

              {/* Toggle 2: Housing */}
              <div className="flex items-center gap-2 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setRecHousing(!recHousing); }}
                  className={`w-6 h-6 border-2 border-black mc-slot flex items-center justify-center shrink-0 ${recHousing ? 'active' : ''}`}
                >
                  {recHousing && <Check className="w-4 h-4 text-[#ffff55]" />}
                </button>
                <span className="text-[11px] font-mono text-stone-350">Dormitories Built-In</span>
              </div>

              <button
                onClick={handleApplyRecFilters}
                className="w-full mc-btn py-2 text-[8px] font-press mt-2 text-[#ffff55] uppercase"
              >
                🔮 Re-Calibrate Match
              </button>
            </div>

            {/* Right container: Matches results with match indicators */}
            <div className="lg:col-span-3 space-y-4">
              {recLoading ? (
                <div className="flex flex-col items-center justify-center py-24 font-press text-[11px] text-[#ffff55] gap-3">
                  <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
                  <span className="mc-text-shadow">CASTING RECOMMENDATION SPELL...</span>
                </div>
              ) : recommendedUnis.length === 0 ? (
                <div className="p-12 text-center bg-[#2c2c2c] border-4 border-black font-press text-[10px] text-stone-400">
                  No compatible target keeps found for these filter sliders. Adjust caps or GPA filters in your profile settings.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-press text-[10px] text-[#55ff55] mc-text-shadow uppercase tracking-wide">
                    TOP {recommendedUnis.length} ADMISSIBLE MATCHES
                  </h4>

                  {recommendedUnis.map((recItem, index) => (
                    <div 
                      key={recItem.university.id}
                      className="bg-[#2c2c2c] border-4 border-black p-5 flex flex-col md:flex-row justify-between gap-5 hover:border-[#ffff55] transition-all [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]"
                    >
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-press text-[#64e3ff] text-[9px] mc-text-shadow mr-2">#{index + 1} MATCH</span>
                          
                          <span className="bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 px-2 py-0.5">
                            GLOBAL RANK #{recItem.university.ranking}
                          </span>
                          <span className="bg-stone-900 border border-stone-800 text-[10px] font-mono text-[#ffff55] px-2 py-0.5 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-[#ff5555]" /> {recItem.university.country}
                          </span>
                        </div>

                        <h4 className="font-press text-[12px] text-stone-100">{recItem.university.name}</h4>

                        {/* Justification String Block */}
                        <p className="text-xs font-mono text-stone-300 bg-black/35 p-3 rounded-none border border-black border-dashed leading-relaxed">
                          🔬 <span className="text-[#a586ff] font-bold">Counselor Audit:</span> {recItem.reasoning}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {recItem.university.popularMajors?.map((m, idx) => (
                            <span key={idx} className="bg-stone-900 text-stone-400 border border-stone-800 font-sans text-[11px] px-2 py-0.5">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Match metric dial */}
                      <div className="flex flex-col items-center justify-center bg-black/40 border-2 border-black p-4 w-full md:w-36 text-center shrink-0 space-y-1 pt-3.5">
                        <span className="text-[9px] font-press text-stone-400 block uppercase">MATCH SCORE</span>
                        
                        <div className="font-press text-[18px] text-[#55ff55] mc-text-shadow py-1">
                          {recItem.matchScore}%
                        </div>

                        <div className="w-full border-2 border-black h-2.5 bg-stone-900 select-none overflow-hidden">
                          <div 
                            className="bg-[#55ff55] h-full"
                            style={{ width: `${recItem.matchScore}%` }}
                          />
                        </div>

                        <button
                          onClick={() => { playClickSound(); setSelectedUni(recItem.university); }}
                          className="mt-3 bg-[#555] hover:bg-[#888] text-white border-2 border-black text-[8px] font-press p-1 leading-none w-full cursor-pointer uppercase py-1.5"
                        >
                          Dossier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODAL VIEW: INSPECT UNIVERSITY DOSSIER */}
      {selectedUni && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#c6c6c6] border-4 border-black p-5 max-w-lg w-full mc-window-dark text-stone-200">
            
            <div className="flex justify-between items-start border-b-4 border-black pb-3">
              <div className="space-y-1">
                <span className="font-press text-[9px] text-[#64e3ff] mc-text-shadow uppercase block">GLOBAL STRONGHOLD STUDY</span>
                <h3 className="font-press text-[12px] text-stone-100">{selectedUni.name}</h3>
              </div>
              <button
                onClick={() => { playClickSound(); setSelectedUni(null); }}
                className="mc-btn p-1 shrink-0 text-red-500 font-bold"
              >
                X
              </button>
            </div>

            <div className="py-4 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-black/35 p-3.5 border-2 border-black">
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">LAND ZONE LOCATION:</span>
                  <span className="font-bold text-[#e1e1e1] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedUni.city}, {selectedUni.country}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">GLOBAL RANKINGS INDEX:</span>
                  <span className="font-bold text-[#64e3ff]">QS World Rank #{selectedUni.ranking}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">ADMIT GPA REQUIREMENT:</span>
                  <span className="font-bold text-[#ffaa00]">{(selectedUni.averageGpa ?? 3.0).toFixed(2)} / 4.0</span>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">ACCEPTANCE PROBABILITY:</span>
                  <span className="font-bold text-[#55ff55]">{selectedUni.acceptanceRate}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">ESTIMATED TUITION RANGE:</span>
                  <span className="font-bold text-[#ffff55]">
                    {selectedUni.tuitionMin === 0 ? "Free Nodes (German/Nordic model)" : `${convertAmount(selectedUni.tuitionMin)} - ${convertAmount(selectedUni.tuitionMax)} / Year`}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-stone-400 text-[10px] block">CAMPUS ACCOMODATION:</span>
                  <span className={`font-bold ${selectedUni.hasOnCampusHousing ? 'text-[#55ff55]' : 'text-[#ff5555]'}`}>
                    {selectedUni.hasOnCampusHousing ? "Dorms Built-In Available" : "Off-site Search Necessary"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-press text-stone-400 uppercase block">Affiliated Loot Contracts (Scholarships):</span>
                <div className="p-2.5 bg-stone-900 border border-stone-800 text-stone-350 italic">
                  {selectedUni.offeredScholarships && selectedUni.offeredScholarships.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUni.offeredScholarships?.map(schId => (
                        <span key={schId} className="bg-[#3b3b8c] text-yellow-300 font-press text-[8px] px-2 py-1 uppercase border border-black select-none">
                          🔑 {schId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "No direct institutional fellowship codes linked. Explore standard global loops (Fulbright or Erasmus Mundus)."
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-press text-stone-400 uppercase block">POPULAR MAJORS CATALOGED:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUni.popularMajors?.map((major, i) => (
                    <span key={i} className="bg-stone-900 text-stone-250 px-2 py-0.5 border border-stone-800 select-all font-sans text-xs">
                      {major}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-t border-stone-700 pt-3.5">
              <button
                onClick={() => {
                  playClickSound();
                  window.open(getCleanUniversityUrl(selectedUni, false), '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 mc-btn bg-[#3b3b8c] text-[#ffff55] py-2 text-[10px] font-press"
                title="Launch Official University Website"
              >
                🌐 Website
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  window.open(getCleanUniversityUrl(selectedUni, true), '_blank', 'noopener,noreferrer');
                }}
                className="flex-1 mc-btn bg-emerald-950 text-[#55ff55] py-2 text-[10px] font-press"
                title="Launch Official University Application Portal"
              >
                📝 Apply Portal
              </button>
              <button
                onClick={() => { playClickSound(); setSelectedUni(null); }}
                className="flex-1 mc-btn text-white py-2 text-[10px] font-press"
              >
                Return
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
