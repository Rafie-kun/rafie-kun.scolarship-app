import React, { useState, useEffect } from 'react';
import { Search, Trophy, Filter, ArrowRight, Award, Target, Sparkles, CheckCircle, Clock } from 'lucide-react';
import { Scholarship, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';

interface RecommendedScholarship {
  scholarship: Scholarship;
  matchScore: number;
  reasoning: string;
}

export default function ScholarshipsView() {
  const { authorizedFetch, profile, rewardPoints } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'all' | 'recommender'>('all');

  // Database list states
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [recommendedSchs, setRecommendedSchs] = useState<RecommendedScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);

  // Search/Filters states
  const [search, setSearch] = useState('');
  const [gpaMin, setGpaMin] = useState('');
  const [gpaMax, setGpaMax] = useState('');
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
  const [fundingType, setFundingType] = useState('all');
  const [sortBy, setSortBy] = useState('score_desc');
  const [savedSuccess, setSavedSuccess] = useState('');

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(4); 
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Synced profile GPA on startup
  useEffect(() => {
    if (profile && profile.gpa) {
      setGpaMax(String(profile.gpa));
    }
  }, [profile]);

  // Load all scholarships
  const fetchScholarships = async () => {
    setLoading(true);
    try {
      let query = `/api/scholarships?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (gpaMin) query += `&gpa_min=${gpaMin}`;
      if (gpaMax) query += `&gpa_max=${gpaMax}`;
      if (fundingType && fundingType !== 'all') query += `&fundingType=${fundingType}`;
      
      if (selectedDegrees.length > 0) {
        selectedDegrees.forEach((deg) => {
          query += `&degreeLevel=${encodeURIComponent(deg)}`;
        });
      }

      const res = await authorizedFetch(query);
      if (res.ok) {
        const data = await res.json();
        setScholarships(data.scholarships || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (e) {
      console.error("Failed to load scholarships database:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load recommended scholarships
  const fetchRecommendedSchs = async () => {
    setRecLoading(true);
    try {
      const res = await authorizedFetch('/api/best-scholarships');
      if (res.ok) {
        const data = await res.json();
        setRecommendedSchs(data || []);
      }
    } catch (e) {
      console.error("Failed to compile recommended scholarships:", e);
    } finally {
      setRecLoading(false);
    }
  };

  // Trigger search updates
  useEffect(() => {
    if (activeTab === 'all') {
      fetchScholarships();
    } else {
      fetchRecommendedSchs();
    }
  }, [search, gpaMin, gpaMax, selectedDegrees, fundingType, sortBy, page, activeTab]);

  // Reset Filters
  const handleResetFilters = () => {
    playClickSound();
    setSearch('');
    setGpaMin('');
    setGpaMax(() => profile?.gpa ? String(profile.gpa) : '');
    setSelectedDegrees([]);
    setFundingType('all');
    setSortBy('score_desc');
    setPage(1);
  };

  const toggleDegreeFilter = (deg: string) => {
    playClickSound();
    setSelectedDegrees(prev => 
      prev.includes(deg) ? prev.filter(d => d !== deg) : [...prev, deg]
    );
    setPage(1);
  };

  // Track Scholarship (reusable)
  const handleSaveApp = async (sch: Scholarship) => {
    playClickSound();
    
    const newApp = {
      id: 'app-' + Date.now(),
      name: sch.name,
      providerOrUni: sch.provider,
      deadline: sch.deadline,
      status: 'Saved',
      notes: `Tracked automatically under Candidate GPA profile. Required Threshold: ≥ ${sch.gpaRequirement.toFixed(2)}.`,
      checklist: [
        { text: 'Check curriculum credit hours guidelines', done: false },
        { text: 'Outline custom Statement of Purpose', done: false },
        { text: 'Prepare verified transcripts from home college', done: true }
      ]
    };

    try {
      const res = await authorizedFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: newApp })
      });

      if (res.ok) {
        // Claim XP points and auto-clear state after set duration
        const actionName = `Tracked Scholarship: ${sch.name}`;
        if (!rewardedActionsRef.current.has(actionName)) {
          rewardedActionsRef.current.add(actionName);
          await rewardPoints(15, actionName, "Scholar Ledger");
        }
        setSavedSuccess(`Added "${sch.name}" safely into your Quest Book! (+15 XP Claimed!)`);
        playAdvancementSound();
        
        // Auto-clears XP notifications cleanly after 4 seconds!
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setSavedSuccess('');
        }, 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Remaining Days helper
  const getRemainingDays = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6" id="scholarpath-scholarships-v2">
      
      {/* Page Title Header Block */}
      <div className="mc-window-dark border-4 border-black text-stone-200">
        <h3 className="font-press text-[11px] text-[#55ff55] uppercase flex items-center gap-2 mc-text-shadow">
          <Trophy className="w-5 h-5 text-[#55ff55]" /> LOOT REGISTRY (SCHOLARSHIPS DIRECTORY)
        </h3>
        <p className="text-xs text-stone-350 font-mono mt-2 pl-0.5 leading-relaxed">
          Search, evaluate, and target fully-funded master stipends, global fellowships, and research grants. Check entry compatibility margins matching your player scores in real-time.
        </p>
      </div>

      {/* Auto-clearing XP award alert banner */}
      {savedSuccess && (
        <div className="bg-emerald-950 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-semibold">{savedSuccess}</span>
        </div>
      )}

      {/* Navigation tabs selector */}
      <div className="flex gap-2">
        <button
          onClick={() => { playClickSound(); setActiveTab('all'); }}
          className={`px-4 py-2 font-press text-[9px] uppercase border-4 border-black text-shadow ${
            activeTab === 'all' 
              ? 'bg-[#3b3b8c] text-[#ffff55] border-t-[#c9c9ff] border-left-[#c9c9ff]' 
              : 'bg-[#555] text-stone-300'
          }`}
        >
          🏆 All Scholarship Loot Pools
        </button>
        <button
          onClick={() => { playClickSound(); setActiveTab('recommender'); fetchRecommendedSchs(); }}
          className={`px-4 py-2 font-press text-[9px] uppercase border-4 border-black text-shadow ${
            activeTab === 'recommender' 
              ? 'bg-[#3b3b8c] text-[#ffff55] border-t-[#c9c9ff] border-left-[#c9c9ff]' 
              : 'bg-[#555] text-stone-300'
          }`}
        >
          🔮 Best Matches for You
        </button>
      </div>

      {/* TAB 1: ALL REGULATED SCHOLARSHIPS DIRECTORY */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Filtering Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-[#2c2c2c] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <span className="font-press text-[9px] text-[#ffff55] uppercase flex items-center gap-1.5 mc-text-shadow">
                  <Filter className="w-4 h-4 text-[#ffff55]" /> Filter Specs
                </span>
                <button 
                  onClick={handleResetFilters}
                  className="text-[9px] font-mono text-stone-400 hover:text-[#ffff55] uppercase underline cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* GPA Threshold criteria */}
              <div className="space-y-3 mb-5">
                <label className="text-[10px] font-press text-stone-300 block uppercase">GPA Range filter</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-mono text-stone-400 block mb-1">MIN REQUIREMENT</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={gpaMin}
                      onChange={(e) => { setGpaMin(e.target.value); setPage(1); }}
                      className="w-full bg-[#141414] border-2 border-black px-2 py-1.5 text-xs font-mono text-stone-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-stone-400 block mb-1">MAX LIMIT</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="4.00"
                      value={gpaMax}
                      onChange={(e) => { setGpaMax(e.target.value); setPage(1); }}
                      className="w-full bg-[#141414] border-2 border-black px-2 py-1.5 text-xs font-mono text-stone-200 outline-none"
                    />
                  </div>
                </div>
                {profile && (
                  <div className="bg-black/40 border border-stone-800 p-2 font-mono text-[10px] text-stone-400">
                    Your profile GPA: <span className="text-[#55ff55] font-bold">{(profile?.gpa ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Degree Filter Checkboxes */}
              <div className="space-y-2 mb-5 border-t border-stone-700 pt-3">
                <label className="text-[10px] font-press text-stone-300 block uppercase">Level Class</label>
                {["Master's Degree", "Ph.D.", "Undergraduate"].map((deg) => (
                  <label key={deg} className="flex items-center gap-2 font-mono text-xs text-stone-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={selectedDegrees.includes(deg)}
                      onChange={() => toggleDegreeFilter(deg)}
                      className="accent-[#55ff55] w-4 h-4 cursor-pointer"
                    />
                    <span>{deg}</span>
                  </label>
                ))}
              </div>

              {/* Funding filters */}
              <div className="space-y-2 mb-3 border-t border-stone-700 pt-3">
                <label className="text-[10px] font-press text-stone-300 block uppercase">Funding Types</label>
                <select
                  value={fundingType}
                  onChange={(e) => { setFundingType(e.target.value); setPage(1); playClickSound(); }}
                  className="w-full bg-[#141414] border-2 border-black px-2 py-1.5 text-xs font-mono text-stone-200 outline-none"
                >
                  <option value="all">Any Funding Levels</option>
                  <option value="Fully Funded">Fully Funded (Tome & Board)</option>
                  <option value="Partially Funded">Partially Funded (Tuition-only)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Cards feed lists */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Search inputs */}
            <div className="bg-[#4a4a4a] border-4 border-black p-4 flex flex-col md:flex-row gap-4 [box-shadow:inset_-4px_-4px_0_#2a2a2a,inset_4px_4px_0_#7a7a7a]">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Type name, land, or target major criteria..."
                  className="w-full bg-[#1e1c1b] border-4 border-black py-1.5 pl-9 pr-4 text-xs font-mono text-stone-200 focus:outline-none focus:border-[#ffff55]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-press uppercase text-[#ffff55] mc-text-shadow">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); playClickSound(); }}
                  className="bg-[#1e1c1b] border-4 border-black py-1 px-2 text-xs font-mono text-stone-200 outline-none focus:border-[#ffff55]"
                >
                  <option value="score_desc">Highest Rating</option>
                  <option value="gpa_asc">GPA Req: Low to High</option>
                  <option value="gpa_desc">GPA Req: High to Low</option>
                  <option value="deadline_asc">Upcoming Deadline</option>
                  <option value="alphabetical">Alphabetical A-Z</option>
                </select>
              </div>
            </div>

            {/* List entries */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 font-press text-[11px] text-[#ffff55] gap-3">
                <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
                <span className="mc-text-shadow">MINING LOOT ENTRIES...</span>
              </div>
            ) : scholarships.length === 0 ? (
              <div className="p-12 text-center bg-[#2c2c2c] border-4 border-black font-press text-[10px] text-stone-400">
                Loot matrix empty! Try widening your criteria parameters.
              </div>
            ) : (
              <div className="space-y-4">
                {scholarships.map((sch) => {
                  const daysLeft = getRemainingDays(sch.deadline);
                  const gpaMatch = profile ? profile.gpa >= sch.gpaRequirement : true;

                  return (
                    <div 
                      key={sch.id}
                      className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] hover:border-[#ffff55] transition-all flex flex-col md:flex-row justify-between gap-6"
                    >
                      <div className="flex-1 space-y-3.5">
                        <div className="flex flex-wrap items-center gap-2 border-b border-[#3e3e3e] pb-2">
                          <span className="font-press text-[8px] text-[#ffaa00] mc-text-shadow uppercase mr-2">{sch.provider}</span>
                          <span className="text-[10px] font-bold text-[#55ff55] bg-black/40 px-2.5 py-0.5 border border-[#55ff55]/20 font-mono">
                            💰 {sch.fundingCoverage}
                          </span>
                          {daysLeft <= 90 && (
                            <span className="text-[9px] font-bold bg-red-950 text-red-300 px-2 py-0.5 border border-red-800/20 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Urgent: {daysLeft} Days Left!
                            </span>
                          )}
                        </div>

                        <h4 className="font-press text-[11px] text-[#ffff55] mc-text-shadow leading-relaxed">{sch.name}</h4>
                        <p className="text-xs text-stone-300 font-sans leading-relaxed">{sch.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono p-3 bg-black/30 border-2 border-black">
                          <div>
                            <span className="text-stone-400 block text-[9px] uppercase">GPA REQUIREMENT:</span>
                            <span className="font-bold flex items-center gap-1.5 mt-0.5">
                              <Target className="w-4 h-4 text-purple-400" />
                              <span className={gpaMatch ? "text-[#55ff55]" : "text-[#ff5555]"}>
                                ≥ {sch.gpaRequirement.toFixed(2)}
                              </span>
                              {gpaMatch ? (
                                <span className="text-[9px] text-[#55ff55] bg-emerald-950 px-1 border border-emerald-500/20 rounded-none">Eligible</span>
                              ) : (
                                <span className="text-[9px] text-[#ff5555] bg-red-950 px-1 border border-red-500/20 rounded-none">Insufficient</span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-stone-400 block text-[9px] uppercase">MATCH SCORE WEIGHT:</span>
                            <span className="font-bold flex items-center gap-1.5 mt-0.5 text-stone-200">
                              <Award className="w-4 h-4 text-yellow-400" /> Base {sch.competitivenessScore}% compatibility
                            </span>
                          </div>

                          <div className="col-span-1 md:col-span-2 border-t border-stone-800 pt-2 text-[11px] text-stone-300">
                            <span className="text-stone-400 block text-[9px] uppercase">Eligible Nationalities & Lands:</span>
                            <span className="mt-0.5 text-[#55ffff] font-semibold">{sch.eligibleCountries.join(", ")}</span>
                          </div>
                        </div>

                      </div>

                      <div className="md:w-48 flex flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-[#3e3e3e] pt-4 md:pt-0 md:pl-5">
                        <div className="text-right space-y-1 w-full">
                          <span className="text-[9px] font-mono text-stone-400 block uppercase">DEADLINE CLOSELINE</span>
                          <span className="text-xs font-mono font-bold text-stone-200 block">{sch.deadline}</span>
                        </div>

                        <button
                          onClick={() => handleSaveApp(sch)}
                          className="w-full mc-btn mt-4 py-2.5 text-[8.5px] uppercase text-[#55ff55]"
                        >
                          Track Quest Loot
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Advanced pagination footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-[#2c2c2c] border-4 border-black p-3.5 gap-4 font-mono text-xs">
                  <span className="text-stone-450 text-[11px]">
                    Revealed <span className="font-bold text-stone-200">{scholarships.length}</span> of <span className="font-bold text-stone-200">{totalItems}</span> matching loot pools
                  </span>
                  
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

              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ADVANCED RECOMMENDED MATCHES LIST */}
      {activeTab === 'recommender' && (
        <div className="space-y-6">
          <div className="bg-[#4a2e22] border-4 border-black p-4 text-stone-200 [box-shadow:inset_-4px_-4px_0_#2b1a13,inset_4px_4px_0_#754c3a] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <span className="font-press text-[9px] text-[#ffaa00] mc-text-shadow uppercase block">CANDIDATE BIODATA OVERVIEW</span>
              <h4 className="font-press text-[12px] text-[#ffff55] mc-text-shadow leading-none">{profile?.fullName}</h4>
              <p className="text-xs font-mono text-stone-300 pt-1.5">
                GPA: <span className="font-bold text-[#55ff55]">{(profile?.gpa ?? 0).toFixed(2)}</span> | Target Field: <span className="font-bold text-[#64e3ff]">{profile?.intendedMajor}</span> | Nationality: <span className="font-bold text-stone-100">{profile?.nationality}</span>
              </p>
            </div>
            <div className="text-stone-300 text-xs font-mono bg-black/45 px-3 py-2 border-2 border-black tracking-normal">
              🔮 Recommendations calibrated in real-time.
            </div>
          </div>

          {recLoading ? (
            <div className="flex flex-col items-center justify-center py-24 font-press text-[11px] text-[#ffff55] gap-3">
              <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
              <span className="mc-text-shadow">EVALUATING ELIGIBILITY SCALES...</span>
            </div>
          ) : recommendedSchs.length === 0 ? (
            <div className="p-12 text-center bg-[#2c2c2c] border-4 border-black font-press text-[10px] text-stone-400">
              No matching fellowships recommended for you. Modify profile parameters to widen search algorithms.
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="font-press text-[10px] text-[#55ff55] mc-text-shadow uppercase tracking-wider">
                COMPATIBILITY MATRIX MATCHES sorted by rank
              </h4>

              {recommendedSchs.map((recItem, index) => {
                const sch = recItem.scholarship;
                const daysLeft = getRemainingDays(sch.deadline);

                return (
                  <div 
                    key={sch.id}
                    className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] hover:border-[#ffff55] transition-all flex flex-col md:flex-row justify-between gap-6"
                  >
                    <div className="flex-1 space-y-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-press text-[#64e3ff] text-[9px] mc-text-shadow mr-2">RECOMMENDED RANK #{index + 1}</span>
                        <span className="bg-stone-900 border border-stone-800 text-[10px] font-mono text-stone-300 px-2 py-0.5">
                          🔑 {sch.provider}
                        </span>
                        <span className="bg-stone-900 border border-stone-800 text-[10px] font-mono text-[#ffff55] px-2 py-0.5">
                          💰 {sch.fundingCoverage}
                        </span>
                        {daysLeft <= 90 && (
                          <span className="text-[9px] font-bold bg-red-950 text-red-300 px-2 pb-0.5 border border-red-800/10 font-mono">
                            Urgent ({daysLeft} days left)
                          </span>
                        )}
                      </div>

                      <h4 className="font-press text-[11px] text-stone-100">{sch.name}</h4>

                      {/* Dynamic justification audit report */}
                      <p className="text-xs font-mono text-stone-300 bg-black/45 p-3 rounded-none border border-black border-dashed leading-relaxed">
                        🔬 <span className="text-[#a586ff] font-bold">Eligibility Justification:</span> {recItem.reasoning}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono p-3 bg-black/35 border border-black">
                        <div>
                          <span className="text-[#a8a29e] block text-[9px] uppercase">GPA minimum:</span>
                          <span className="font-bold text-[#ffaa00] mt-0.5 block">≥ {sch.gpaRequirement.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#a8a29e] block text-[9px] uppercase">Eligible Majors:</span>
                          <span className="font-bold text-[#55ffff] mt-0.5 block truncate max-w-sm" title={sch.eligibleMajors.join(", ")}>
                            {sch.eligibleMajors.slice(0, 3).join(", ")} {sch.eligibleMajors.length > 3 ? "..." : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right action block */}
                    <div className="md:w-44 flex flex-col justify-between items-center bg-black/45 border-2 border-black p-4 shrink-0 text-center space-y-1 min-h-[160px] pt-3.5">
                      <span className="text-[9px] font-press text-stone-400 uppercase">MATCH PROBABILITY</span>
                      
                      <div className="font-press text-[18px] text-[#55ff55] mc-text-shadow py-1">
                        {recItem.matchScore}%
                      </div>

                      <div className="w-full border-2 border-black h-2.5 bg-stone-900 overflow-hidden select-none">
                        <div 
                          className="bg-[#55ff55] h-full"
                          style={{ width: `${recItem.matchScore}%` }}
                        />
                      </div>

                      <button
                        onClick={() => handleSaveApp(sch)}
                        className="mt-3 w-full bg-[#555] hover:bg-stone-700 text-white border-2 border-black text-[8px] font-press py-1.5 cursor-pointer uppercase py-1"
                      >
                        Track Quest
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
