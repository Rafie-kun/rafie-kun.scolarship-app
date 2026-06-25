import React, { useState, useEffect } from 'react';
import { Search, Trophy, Filter, ArrowRight, Award, Target, Sparkles, CheckCircle, Clock, SlidersHorizontal, Mail, ExternalLink, ShieldCheck, HelpCircle, FileText, Globe, Coins } from 'lucide-react';
import { Scholarship, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { getCleanUniversityUrl } from '../utils/urlHelper';

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
  const [eligibleCountry, setEligibleCountry] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [sortBy, setSortBy] = useState('score_desc');
  const [savedSuccess, setSavedSuccess] = useState('');
  const [trackedScholarships, setTrackedScholarships] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  const fetchUniversitiesList = async () => {
    try {
      const res = await authorizedFetch('/api/universities');
      if (res.ok) {
        const data = await res.json();
        const loaded = data.universities || data || [];
        setUniversities(loaded);
      }
    } catch (err) {
      console.error("Failed to load universities list inside scholarships view:", err);
    }
  };

  const fetchTrackedApps = async () => {
    try {
      const res = await authorizedFetch('/api/applications');
      let data = [];
      if (res.ok) {
        data = await res.json();
      }
      
      if (!data || data.length === 0 || profile?.offlineMode) {
        const { getMockApplications } = await import('../services/mockDataService');
        data = getMockApplications();
      }
      
      setApplications(data || []);
      const names = new Set<string>((data || []).map((a: any) => a.name.toLowerCase()));
      setTrackedScholarships(names);
    } catch (e) {
      console.warn("Failed to fetch applications, using fallback", e);
      const { getMockApplications } = await import('../services/mockDataService');
      const mockData = getMockApplications();
      setApplications(mockData);
      setTrackedScholarships(new Set<string>(mockData.map((a: any) => a.name.toLowerCase())));
    }
  };

  useEffect(() => {
    fetchTrackedApps();
    fetchUniversitiesList();
  }, [profile]);

  // UI state
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [selectedSch, setSelectedSch] = useState<Scholarship | null>(null);
  const [trackingSchId, setTrackingSchId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'specs' | 'apply' | 'unis'>('specs');
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const modalAppLink = selectedSch ? (selectedSch.applicationUrl || selectedSch.officialWebsite || `/fellowships/${selectedSch.id}/apply`) : '';
  const modalTrackedApp = selectedSch ? applications.find(app => app.name.toLowerCase() === selectedSch.name.toLowerCase()) : null;
  const modalContactEmail = selectedSch ? ((selectedSch as any).contactEmail || `inquiries@${selectedSch.provider.toLowerCase().replace(/[^a-z0-9]/g, '') || 'scholarship-board'}.org`) : '';
  const modalAppFee = selectedSch ? (((selectedSch as any).applicationFee || (selectedSch as any).appFee || "Free Portal Application")) : '';
  const modalReqDocs = selectedSch ? ((selectedSch as any).requiredDocuments || ["Academic Transcripts (Validated)", "Letters of Recommendation (x2)", "Statement of Purpose (Crafted)", "Curriculum Vitae / Resume", "Proof of Nationality / Passport"]) : [];
  const modalLangReq = selectedSch ? ((selectedSch as any).languageRequirement || "IELTS Overalls ≥ 6.5 or TOEFL iBT ≥ 88 (or English-Medium instruction certificate)") : '';
  const modalSteps = selectedSch ? ((selectedSch as any).applicationSteps || [
    "Verify your eligibility against the target GPA threshold requirements",
    "Draft your high-leverage Statement of Purpose standard blueprint in Scroll Vault",
    "Request recommendation files from active collegiate advisors or research mentors",
    "Verify your official English / target language transcripts of validation",
    "Translate secondary attachments as per active fellowship regulations",
    "Lock-in your submissions to the official registry before the deadline count expires"
  ]) : [];

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4); 
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Load all scholarships
  const fetchScholarships = async () => {
    setLoading(true);
    try {
      let query = `/api/scholarships?page=${page}&limit=${limit}&sortBy=${sortBy}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (gpaMin) query += `&gpa_min=${gpaMin}`;
      if (gpaMax) query += `&gpa_max=${gpaMax}`;
      if (fundingType && fundingType !== 'all') query += `&fundingType=${fundingType}`;
      if (eligibleCountry && eligibleCountry !== 'all') query += `&eligibleCountries=${encodeURIComponent(eligibleCountry)}`;
      
      if (selectedDegrees.length > 0) {
        selectedDegrees.forEach((deg) => {
          query += `&degreeLevel=${encodeURIComponent(deg)}`;
        });
      }

      let data: any = { scholarships: [], totalPages: 1, total: 0 };
      try {
        const res = await authorizedFetch(query);
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {
        console.warn("Scholarships API failed, using fallback:", err);
      }

      if (!data.scholarships || data.scholarships.length === 0) {
        const fallbackRes = await fetch('/data/scholarships.json');
        if (fallbackRes.ok) {
          const allSchs = await fallbackRes.json();
          let filtered = allSchs;
          if (search) filtered = filtered.filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()) || s.provider.toLowerCase().includes(search.toLowerCase()));
          if (fundingType !== 'all') filtered = filtered.filter((s: any) => s.fundingCoverage === fundingType);
          
          if (upcomingOnly) {
            filtered = filtered.filter((sch: any) => getRemainingDays(sch.deadline) <= 120 && getRemainingDays(sch.deadline) > 0);
          }
          
          data.total = filtered.length;
          data.totalPages = Math.ceil(filtered.length / limit);
          const startIndex = (page - 1) * limit;
          data.scholarships = filtered.slice(startIndex, startIndex + limit);
        }
      }

      let loaded = data.scholarships || [];
      if (upcomingOnly) {
        loaded = loaded.filter((sch: Scholarship) => getRemainingDays(sch.deadline) <= 120 && getRemainingDays(sch.deadline) > 0);
      }
      setScholarships(loaded);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.total || 0);
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
      let recs: any[] = [];
      try {
        const res = await authorizedFetch('/api/best-scholarships');
        if (res.ok) {
          recs = await res.json();
        }
      } catch (err) {
        console.warn("Best scholarships API failed, using fallback:", err);
      }

      if (!recs || recs.length === 0) {
        const fallbackRes = await fetch('/data/scholarships.json');
        if (fallbackRes.ok) {
          const allSchs = await fallbackRes.json();
          recs = allSchs.slice(0, 5).map((s: any) => ({
            scholarship: s,
            matchScore: Math.floor(75 + Math.random() * 25),
            reasoning: "Static fallback recommendation logic applied."
          }));
        }
      }

      setRecommendedSchs(recs || []);
    } catch (e) {
      console.error("Failed to compile recommended scholarships:", e);
    } finally {
      setRecLoading(false);
    }
  };

  // Trigger search updates - FIXED dynamic reload bug by mapping limit and country triggers
  useEffect(() => {
    if (activeTab === 'all') {
      fetchScholarships();
    } else {
      fetchRecommendedSchs();
    }
  }, [search, gpaMin, gpaMax, selectedDegrees, fundingType, eligibleCountry, upcomingOnly, sortBy, page, limit, activeTab]);

  // Reset Filters
  const handleResetFilters = () => {
    playClickSound();
    setSearch('');
    setGpaMin('');
    setGpaMax('');
    setSelectedDegrees([]);
    setFundingType('all');
    setEligibleCountry('all');
    setUpcomingOnly(false);
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
    if (trackingSchId) return;
    setTrackingSchId(sch.id);
    playClickSound();
    
    const newApp = {
      id: 'app-' + Date.now(),
      name: sch.name,
      providerOrUni: sch.provider,
      deadline: sch.deadline,
      status: 'Saved' as const,
      notes: `Tracked automatically under Candidate GPA profile. Required Threshold: ≥ ${(sch.gpaRequirement ?? 3.0).toFixed(2)}.`,
      checklist: [
        { text: 'Check curriculum credit hours guidelines', done: false },
        { text: 'Outline custom Statement of Purpose', done: false },
        { text: 'Prepare verified transcripts from home college', done: true }
      ]
    };

    const awardAndNotify = async () => {
      const actionName = `Tracked Scholarship: ${sch.name}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        await rewardPoints(15, actionName, "Scholar Ledger");
      }
      setSavedSuccess(`Added "${sch.name}" safely into your Quest Book! (+15 XP Claimed!)`);
      playAdvancementSound();
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSavedSuccess('');
      }, 4000);
    };

    try {
      const res = await authorizedFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: newApp })
      });

      if (res.ok) {
        const data = await res.json();
        setApplications(data || []);
        setTrackedScholarships(new Set((data || []).map((a: any) => a.name.toLowerCase())));
        await awardAndNotify();
      } else {
        throw new Error("Failed");
      }
    } catch (e) {
      console.warn("API save failed, using local mock", e);
      const { saveMockApplications } = await import('../services/mockDataService');
      const updatedApps = [...applications, newApp];
      saveMockApplications(updatedApps);
      setApplications(updatedApps);
      setTrackedScholarships(new Set((updatedApps || []).map((a: any) => a.name.toLowerCase())));
      await awardAndNotify();
    } finally {
      setTrackingSchId(null);
    }
  };

  const handleStatusChange = async (scholarshipName: string, newStatus: string) => {
    playClickSound();
    const existing = applications.find(app => app.name.toLowerCase() === scholarshipName.toLowerCase());
    if (existing) {
      const updated = { ...existing, status: newStatus };
      
      const notifySuccess = () => {
        setSavedSuccess(`Updated "${scholarshipName}" status to "${newStatus}"!`);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setSavedSuccess('');
        }, 4000);
      };

      try {
        const res = await authorizedFetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: updated })
        });
        if (res.ok) {
          const data = await res.json();
          setApplications(data || []);
          setTrackedScholarships(new Set((data || []).map((a: any) => a.name.toLowerCase())));
          notifySuccess();
        } else {
          throw new Error("Failed");
        }
      } catch (err) {
        console.warn("Failed to update tracking status, falling back to mock", err);
        const { saveMockApplications } = await import('../services/mockDataService');
        const updatedApps = applications.map(a => a.id === updated.id ? updated : a);
        saveMockApplications(updatedApps);
        setApplications(updatedApps);
        setTrackedScholarships(new Set((updatedApps || []).map((a: any) => a.name.toLowerCase())));
        notifySuccess();
      }
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
          
          {/* Left Filtering Sidebar (Collapsible) */}
          {!filtersCollapsed && (
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
                  <label className="text-[10px] font-press text-stone-300 block uppercase font-bold text-[#e0e0e0]">GPA Range filter</label>
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

                {/* Target Land / Eligible Region */}
                <div className="space-y-2 mb-5 border-t border-stone-700 pt-3">
                  <label className="text-[10px] font-press text-stone-300 block uppercase font-bold text-[#e0e0e0]">Target Land / Country</label>
                  <select
                    value={eligibleCountry}
                    onChange={(e) => { setEligibleCountry(e.target.value); setPage(1); playClickSound(); }}
                    className="w-full bg-[#141414] border-2 border-black px-2 py-1.5 text-xs font-mono text-stone-200 outline-none"
                  >
                    <option value="all">Any region (Worldwide)</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="India">India</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Germany">Germany</option>
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                  </select>
                </div>

                {/* Degree Filter Checkboxes */}
                <div className="space-y-2 mb-5 border-t border-stone-700 pt-3">
                  <label className="text-[10px] font-press text-stone-300 block uppercase font-bold text-[#e0e0e0]">Level Class</label>
                  {["Master's Degree", "Ph.D.", "Bachelor's Degree"].map((deg) => (
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
                <div className="space-y-2 mb-5 border-t border-stone-700 pt-3">
                  <label className="text-[10px] font-press text-stone-300 block uppercase font-bold text-[#e0e0e0]">Funding Types</label>
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

                {/* Deadline: upcoming toggle */}
                <div className="space-y-2 border-t border-stone-700 pt-3">
                  <span className="text-[10px] font-press text-stone-300 block uppercase font-bold text-[#e0e0e0] mb-2">Deadline Urgency</span>
                  <label className="flex items-center gap-2 font-mono text-xs text-stone-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={upcomingOnly}
                      onChange={(e) => { setUpcomingOnly(e.target.checked); setPage(1); playClickSound(); }}
                      className="accent-[#55ff55] w-4 h-4 cursor-pointer"
                    />
                    <span>Closing soon (≤120 Days)</span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* Cards feed lists */}
          <div className={`${filtersCollapsed ? "lg:col-span-4" : "lg:col-span-3"} space-y-4`}>
            
            {/* Search inputs */}
            <div className="bg-[#4a4a4a] border-4 border-black p-4 flex flex-col md:flex-row gap-4 [box-shadow:inset_-4px_-4px_0_#2a2a2a,inset_4px_4px_0_#7a7a7a]">
              <button
                onClick={() => { playClickSound(); setFiltersCollapsed(!filtersCollapsed); }}
                className="mc-btn flex items-center gap-1.5 shrink-0 bg-[#3a3a3a]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#ffff55]" /> 
                {filtersCollapsed ? "Show Filters" : "Hide Filters"}
              </button>

              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Type name, land, or target major criteria..."
                  className="scholarship-search-input w-full bg-[#1e1c1b] border-4 border-black py-1.5 pl-11 pr-4 text-xs font-mono text-stone-200 focus:outline-none focus:border-[#ffff55]"
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
                                ≥ {(sch.gpaRequirement ?? 3.0).toFixed(2)}
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
                            <span className="mt-0.5 text-[#55ffff] font-semibold">{sch.eligibleCountries?.join(", ") ?? "Any"}</span>
                          </div>
                        </div>

                      </div>

                      <div className="md:w-48 flex flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-[#3e3e3e] pt-4 md:pt-0 md:pl-5">
                        <div className="text-right space-y-1 w-full">
                          <span className="text-[9px] font-mono text-stone-400 block uppercase">DEADLINE CLOSELINE</span>
                          <span className="text-xs font-mono font-bold text-stone-200 block">{sch.deadline}</span>
                        </div>

                        <div className="w-full space-y-2 mt-4">
                          <button
                            onClick={() => { playClickSound(); setSelectedSch(sch); }}
                            className="w-full mc-btn py-2 text-[8px] uppercase text-[#ffff55] border-t-[#ffffaa] border-left-[#ffffaa] bg-stone-750"
                          >
                            🔬 Inspect Dossier
                          </button>
                          {(() => {
                            const trackedApp = applications.find(app => app.name.toLowerCase() === sch.name.toLowerCase());
                            if (trackedApp) {
                              return (
                                <div className="w-full space-y-1">
                                  <span className="text-[7.5px] font-mono text-stone-300 block uppercase tracking-tight text-center">Quest Progress:</span>
                                  <select
                                    value={trackedApp.status || 'Saved'}
                                    onChange={(e) => handleStatusChange(sch.name, e.target.value)}
                                    className="w-full bg-[#18181b] border-2 border-[#55ff55] text-[8px] font-press text-[#55ff55] px-1 py-1.5 focus:outline-none"
                                  >
                                    <option value="Saved" className="bg-stone-900 text-stone-200">📌 Saved</option>
                                    <option value="In Progress" className="bg-stone-900 text-yellow-300">⏳ In Progress</option>
                                    <option value="Submitted" className="bg-stone-900 text-blue-300">📤 Submitted</option>
                                    <option value="Accepted" className="bg-stone-900 text-green-300">✅ Accepted</option>
                                    <option value="Won" className="bg-stone-900 text-amber-300">🏅 Won</option>
                                  </select>
                                </div>
                              );
                            }
                            return (
                              <button
                                onClick={() => handleSaveApp(sch)}
                                disabled={trackingSchId === sch.id}
                                className="tour-track-btn w-full mc-btn py-2 text-[8px] uppercase text-[#55ff55] disabled:opacity-50"
                              >
                                {trackingSchId === sch.id ? "TRACKING..." : "Track Quest Loot"}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Advanced pagination footer with limit selector and show all */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-[#2c2c2c] border-4 border-black p-3.5 gap-4 font-mono text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-stone-455 text-[11px]">
                      Revealed <span className="font-bold text-stone-200">{scholarships.length}</span> of <span className="font-bold text-stone-200">{totalItems}</span> matching loot pools
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
                        <option value={4}>4 Slots</option>
                        <option value={8}>8 Slots</option>
                        <option value={16}>16 Slots</option>
                        <option value={50}>50 Slots (Show All)</option>
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
                          <span className="font-bold text-[#ffaa00] mt-0.5 block">≥ {(sch.gpaRequirement ?? 3.0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#a8a29e] block text-[9px] uppercase">Eligible Majors:</span>
                          <span className="font-bold text-[#55ffff] mt-0.5 block truncate max-w-sm" title={sch.eligibleMajors?.join(", ") ?? "Any"}>
                            {sch.eligibleMajors?.slice(0, 3).join(", ") ?? "Any"} {sch.eligibleMajors && sch.eligibleMajors.length > 3 ? "..." : ""}
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

                      <div className="w-full space-y-1.5 mt-3">
                        <button
                          onClick={() => { playClickSound(); setSelectedSch(sch); }}
                          className="w-full bg-[#3b3b8c] hover:bg-[#4d4db8] text-[#ffff55] border-2 border-black text-[8px] font-press py-1 cursor-pointer uppercase py-1.5"
                        >
                          Inspect Details
                        </button>
                        {(() => {
                          const trackedApp = applications.find(app => app.name.toLowerCase() === sch.name.toLowerCase());
                          if (trackedApp) {
                            return (
                              <div className="w-full space-y-1">
                                <span className="text-[7.5px] font-mono text-stone-300 block uppercase tracking-tight text-center">Progress:</span>
                                <select
                                  value={trackedApp.status || 'Saved'}
                                  onChange={(e) => handleStatusChange(sch.name, e.target.value)}
                                  className="w-full bg-[#18181b] border-2 border-[#55ff55] text-[8px] font-press text-[#55ff55] px-1 py-1 focus:outline-none"
                                >
                                  <option value="Saved" className="bg-stone-900 text-stone-200">📌 Saved</option>
                                  <option value="In Progress" className="bg-stone-900 text-yellow-300">⏳ In Progress</option>
                                  <option value="Submitted" className="bg-stone-900 text-blue-300">📤 Submitted</option>
                                  <option value="Accepted" className="bg-stone-900 text-green-300">✅ Accepted</option>
                                  <option value="Won" className="bg-stone-900 text-amber-300">🏅 Won</option>
                                </select>
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => handleSaveApp(sch)}
                              className="w-full border-2 border-black text-[8px] font-press py-1.5 cursor-pointer uppercase bg-[#555] hover:bg-stone-750 text-white"
                            >
                              Track Quest
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* LOOT DOSSIER SPECIFIC EXTRA DETAIL MODAL */}
      {selectedSch && (
        <div className="fixed inset-y-0 inset-x-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#2c2c2c] border-4 border-black p-5 max-w-xl w-full mc-window border-t-stone-200 border-left-stone-200 text-stone-100 flex flex-col justify-between my-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-3">
              <div className="space-y-1">
                <span className="font-press text-[8.5px] text-[#ffaa00] mc-text-shadow uppercase tracking-wider block">FELLOWSHIP BLUEPRINT & CONTRACT</span>
                <h3 className="font-press text-[12px] text-[#ffff55] mc-text-shadow leading-normal">{selectedSch.name}</h3>
                <span className="text-[10px] font-mono text-stone-400 block mt-0.5">Offered by: <strong className="text-stone-300">{selectedSch.provider}</strong></span>
              </div>
              <button
                onClick={() => { playClickSound(); setSelectedSch(null); }}
                className="bg-stone-800 hover:bg-stone-750 px-2.5 py-1 text-red-400 border-2 border-black text-xs font-bold shrink-0 cursor-pointer"
              >
                X
              </button>
            </div>
                {/* Modal Sub Tab Selectors */}
            <div className="flex gap-2 border-b-2 border-black pb-2 mt-3 select-none">
              <button
                onClick={() => { playClickSound(); setModalTab('specs'); }}
                className={`flex-1 py-2 px-3 font-press text-[8.5px] uppercase border-2 border-black cursor-pointer ${
                  modalTab === 'specs' ? 'bg-[#3b3b8c] text-[#ffff55]' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                📊 General Specs
              </button>
              <button
                onClick={() => { playClickSound(); setModalTab('apply'); }}
                className={`flex-1 py-2 px-3 font-press text-[8.5px] uppercase border-2 border-black cursor-pointer ${
                  modalTab === 'apply' ? 'bg-[#eab308]/20 border-[#eab308] text-[#ffff55]' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                📝 How to Apply Checklist
              </button>
              <button
                onClick={() => { playClickSound(); setModalTab('unis'); }}
                className={`flex-1 py-2 px-3 font-press text-[8.5px] uppercase border-2 border-black cursor-pointer ${
                  modalTab === 'unis' ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                🏛️ Affiliated Uni
              </button>
            </div>

            {/* Body scroll compartment */}
            <div className="my-4 py-1 space-y-4 font-mono text-xs max-h-[60vh] overflow-y-auto pr-1">
              
              {modalTab === 'specs' ? (
                <>
                  {/* Short coverage details banner */}
                  <div className="grid grid-cols-2 gap-3 bg-black/45 p-3.5 border-2 border-black">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block">Loot Coverage Class:</span>
                      <span className="font-bold text-[#55ff55]">💎 {selectedSch.fundingCoverage}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block">Active Target GPA Threshold:</span>
                      <span className="font-bold text-[#ffaa00]">≥ {(selectedSch.gpaRequirement ?? 3.0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block">Submissions Deadline:</span>
                      <span className="font-bold text-stone-200">📅 {selectedSch.deadline}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block">Total Eligibility Rating:</span>
                      <span className="font-bold text-[#64e3ff]">🎖️ {selectedSch.competitivenessScore}% Compatibility</span>
                    </div>
                  </div>

                  {/* Main description quote */}
                  <div className="p-3 bg-stone-900 border border-stone-800 rounded-none leading-relaxed text-stone-300 text-xs italic">
                    "{selectedSch.description}"
                  </div>

                  {/* Additional detailed requirements requested */}
                  <div className="space-y-3 p-3 bg-black/25 border border-stone-800 rounded-none">
                    {/* Lang and toll */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-[#ffff55]" /> Language metrics:
                        </span>
                        <span className="text-[#a586ff] text-xs font-semibold block bg-black/40 px-2 py-1 select-none border border-black">{modalLangReq}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-[#55ff55]" /> Submission Toll (Fee):
                        </span>
                        <span className="text-[#55ff55] text-xs font-semibold block bg-black/40 px-2 py-1 select-none border border-black">{modalAppFee}</span>
                      </div>
                    </div>

                    {/* Required Inventory items */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-stone-300" /> Required inventory documents:
                      </span>
                      <ul className="list-none space-y-1 pl-1">
                        {modalReqDocs.map((doc: string, dIdx: number) => (
                          <li key={dIdx} className="text-stone-300 text-xs flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact Inquiry email */}
                    <div className="space-y-1 border-t border-stone-800 pt-3">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#ff4f4f]" /> Support guild inquiry email:
                      </span>
                      <a href={`mailto:${modalContactEmail}`} className="text-blue-300 hover:underline select-all flex items-center gap-1 leading-none text-xs">
                        {modalContactEmail}
                      </a>
                    </div>
                  </div>

                  {/* Eligible Majors */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">Eligible Majors Registry:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSch.eligibleMajors?.map((m, mIdx) => (
                        <span key={mIdx} className="bg-stone-900 border border-stone-800 text-[11px] text-stone-300 px-2 py-0.5 select-none font-sans">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Eligible Nations */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">Eligible Nations Registry:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSch.eligibleCountries?.map((c, cIdx) => (
                        <span key={cIdx} className="bg-stone-900 border border-stone-800 text-[11px] text-[#55ffff] px-2 py-0.5 font-sans select-none">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : modalTab === 'apply' ? (
                <div className="space-y-4">
                  <div className="bg-amber-950/20 border border-amber-500/30 p-3 text-stone-300 text-xs rounded-none">
                    🚀 Follow these chronological blueprints to organize and submit your application folder successfully. Check off steps as you secure them!
                  </div>

                  {/* Iterative Checkboxes checklist */}
                  <div className="space-y-3 pl-1">
                    {modalSteps.map((step: string, idx: number) => {
                      const isDone = !!checkedSteps[idx];
                      return (
                        <div
                          key={`step-${idx}`}
                          onClick={() => {
                            playClickSound();
                            setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
                          }}
                          className={`flex items-start gap-3 p-3 border-2 cursor-pointer transition-colors ${
                            isDone 
                              ? 'bg-green-950/20 border-[#55ff55]/40 text-stone-200' 
                              : 'bg-black/30 border-stone-800 text-stone-300 hover:border-[#ffff55]'
                          }`}
                        >
                          <div className={`w-5 h-5 flex items-center justify-center border-2 shrink-0 ${
                            isDone ? 'border-[#55ff55] bg-green-950 text-[#55ff55]' : 'border-stone-500 bg-black/40'
                          }`}>
                            {isDone && "✔"}
                          </div>
                          <div className="space-y-1 text-xs">
                             <span className="text-[10px] uppercase font-bold text-stone-500 block">Stage {idx + 1}</span>
                             <p className={isDone ? 'line-through text-stone-400' : 'text-stone-200'}>{step}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fee status indicator bar */}
                  <div className="bg-black/45 p-3.5 border-2 border-black flex justify-between items-center text-xs">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Estimated Submission Toll:</span>
                    <span className="font-bold text-[#55ff55]">{modalAppFee}</span>
                  </div>

                  {/* Official URL bar */}
                  <div className="bg-stone-900 border border-stone-800 p-3 space-y-1 text-xs">
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">Official Gateway Domain:</span>
                    <a
                      href={modalAppLink}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noreferrer"
                      className="text-[#64e3ff] hover:underline flex items-center gap-1.5 break-all"
                    >
                      <Globe className="w-4 h-4 text-[#64e3ff] shrink-0" /> {modalAppLink}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 text-stone-200 text-xs rounded-none">
                    🏛️ **ScholarPath Unified Intelligence Match**: Here are the global universities offering or matching this scholarship. Launch their portal or website with a single click.
                  </div>

                  <div className="space-y-3">
                    {(() => {
                      const sch = selectedSch;
                      const eligibleCountriesLower = sch.eligibleCountries?.map(c => c.toLowerCase()) ?? [];
                      const eligibleMajorsLower = sch.eligibleMajors?.map(m => m.toLowerCase()) ?? [];

                      const matchedUnis = universities.filter(uni => {
                        const isDirectIdMatch = uni.offeredScholarships && (
                          uni.offeredScholarships.includes(sch.id) || 
                          uni.offeredScholarships.includes(sch.name)
                        );
                        if (isDirectIdMatch) return true;

                        const countryMatch = eligibleCountriesLower.includes(uni.country.toLowerCase()) || 
                                             eligibleCountriesLower.includes('global') || 
                                             eligibleCountriesLower.includes('all') ||
                                             eligibleCountriesLower.some(c => uni.country.toLowerCase().includes(c));

                        const majorsMatch = uni.popularMajors && uni.popularMajors.some((major: string) => 
                          eligibleMajorsLower.some(m => m.includes(major.toLowerCase()) || major.toLowerCase().includes(m))
                        );

                        return countryMatch && majorsMatch;
                      });

                      const displayUnis = matchedUnis.length > 0 ? matchedUnis : universities.filter(uni => 
                        eligibleCountriesLower.includes(uni.country.toLowerCase()) || 
                        eligibleCountriesLower.includes('global') ||
                        eligibleCountriesLower.includes('all') ||
                        eligibleCountriesLower.some(c => uni.country.toLowerCase().includes(c))
                      ).slice(0, 5);

                      if (displayUnis.length === 0) {
                        return (
                          <div className="p-8 text-center text-stone-400 text-xs border border-stone-800">
                            No direct affiliated or regional partner universities found. Please check official fellowship channels below.
                          </div>
                        );
                      }

                      return displayUnis.map((uni) => (
                        <div key={uni.id} className="p-3 bg-black/45 border-2 border-black space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-stone-100 text-xs">{uni.name}</h4>
                              <span className="text-stone-400 text-[10px] block">{uni.city}, {uni.country} • Rank #{uni.ranking}</span>
                            </div>
                            <span className="text-[10px] bg-indigo-950 px-2 py-0.5 text-indigo-300 font-bold border border-indigo-800">
                              GPA Req: ≥{(uni.averageGpa ?? 3.0).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {uni.popularMajors?.slice(0, 3).map((major: string, mIdx: number) => (
                              <span key={mIdx} className="bg-stone-900 text-stone-400 px-1.5 py-0.5 text-[9px] border border-stone-800">
                                {major}
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-stone-900">
                            <button
                              onClick={() => {
                                playClickSound();
                                window.open(getCleanUniversityUrl(uni, false), '_blank', 'noopener,noreferrer');
                              }}
                              className="flex-1 px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-normal bg-stone-900 border border-stone-800 text-stone-300 hover:text-white"
                            >
                              🌐 Website
                            </button>
                            <button
                              onClick={() => {
                                playClickSound();
                                window.open(getCleanUniversityUrl(uni, true), '_blank', 'noopener,noreferrer');
                              }}
                              className="flex-1 px-2.5 py-1 text-[9.5px] uppercase font-bold tracking-normal bg-[#f5c842] border border-black text-black font-bold hover:bg-yellow-400"
                            >
                              📝 Apply Portal
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Action operations footer */}
            <div className="flex flex-col sm:flex-row gap-3 border-t-2 border-black pt-3.5">
              <a
                href={modalAppLink}
                target="_blank"
                referrerPolicy="no-referrer"
                rel="noreferrer"
                onClick={() => playClickSound()}
                className="flex-1 bg-yellow-950 hover:bg-yellow-900 text-[#ffff55] border-2 border-black py-2.5 px-3 uppercase text-[10px] font-press rounded-none text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4 shrink-0 text-[#ffff55]" /> Launch Official Portal
              </a>
              {modalTrackedApp ? (
                <div className="flex-1 flex items-center bg-emerald-950 border-2 border-black py-1 px-3">
                  <span className="text-[9px] font-mono text-stone-300 uppercase mr-2 shrink-0">Status:</span>
                  <select
                    value={modalTrackedApp.status || 'Saved'}
                    onChange={(e) => handleStatusChange(selectedSch.name, e.target.value)}
                    className="flex-1 bg-[#18181b] border border-emerald-500 text-[9px] font-press text-[#55ff55] px-1 py-1 focus:outline-none"
                  >
                    <option value="Saved" className="bg-stone-900 text-stone-200">📌 Saved</option>
                    <option value="In Progress" className="bg-stone-900 text-yellow-300">⏳ In Progress</option>
                    <option value="Submitted" className="bg-stone-900 text-blue-300">📤 Submitted</option>
                    <option value="Accepted" className="bg-stone-900 text-green-300">✅ Accepted</option>
                    <option value="Won" className="bg-stone-900 text-amber-300">🏅 Won</option>
                  </select>
                </div>
              ) : (
                <button
                  disabled={trackingSchId === selectedSch.id}
                  onClick={() => {
                    handleSaveApp(selectedSch);
                    setSelectedSch(null);
                  }}
                  className="flex-1 bg-green-950 hover:bg-green-900 text-[#55ff55] border-2 border-black py-2.5 px-3 uppercase text-[10px] font-press rounded-none shrink-0"
                >
                  {trackingSchId === selectedSch.id ? "TRACKING..." : "🧬 Bind To Quest Track"}
                </button>
              )}
              <button
                onClick={() => { playClickSound(); setSelectedSch(null); }}
                className="bg-stone-800 hover:bg-stone-750 text-white border-2 border-black py-2.5 px-4 uppercase text-[10px] font-press rounded-none"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
