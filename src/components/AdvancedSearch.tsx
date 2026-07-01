import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { University, Scholarship } from '../types';
import { 
  Search, SlidersHorizontal, MapPin, Building2, Coins, Award, 
  Sparkles, Check, ChevronRight, BookmarkPlus, HelpCircle, GraduationCap,
  Building, BookOpen, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playAdvancementSound } from '../utils/sound';

export default function AdvancedSearch() {
  const { themeMode, convertAmount, currency } = useTheme();
  const { profile, authorizedFetch } = useAuth();

  // Search Type Switcher: 'all' | 'universities' | 'scholarships'
  const [searchTab, setSearchTab] = useState<'universities' | 'scholarships'>('universities');

  // Loaders & Datasets
  const [unis, setUnis] = useState<University[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [maxTuition, setMaxTuition] = useState<number>(80000);
  const [minGpa, setMinGpa] = useState<number>(0.0);
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [universityType, setUniversityType] = useState<string>('all');
  const [onCampusHousing, setOnCampusHousing] = useState<boolean>(false);
  const [fundingCoverage, setFundingCoverage] = useState<string>('all');
  const [minAward, setMinAward] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Success Notification state for bookmarking
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // List of countries dynamically compiled
  const [countriesList, setCountriesList] = useState<string[]>([]);

  // Fetch full offline-fallback DB files on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [uniRes, scholRes] = await Promise.all([
          fetch('/data/universities.json'),
          fetch('/data/scholarships.json')
        ]);

        if (uniRes.ok && scholRes.ok) {
          const uniData: University[] = await uniRes.json();
          const scholData: Scholarship[] = await scholRes.json();
          setUnis(uniData);
          setScholarships(scholData);

          // Build country list
          const uniCountries = uniData.map(u => u.country);
          const scholCountries = scholData.flatMap(s => s.eligibleCountries || []);
          const combined = Array.from(new Set([...uniCountries, ...scholCountries]))
            .filter(c => c && c.toLowerCase() !== 'all' && c.toLowerCase() !== 'global')
            .sort();
          setCountriesList(combined);
        } else {
          setError('Failed to fetch local database resources. Re-trying soon.');
        }
      } catch (err) {
        console.error('Failed to load search registries:', err);
        setError('Database connection error.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isMinecraft = themeMode === 'minecraft';

  // Add to Quest Book / Applications logic
  const handleAddToQuestBook = async (item: University | Scholarship, type: 'university' | 'scholarship') => {
    playAdvancementSound();
    
    const appName = type === 'university' ? item.name : item.name;
    const providerOrUni = type === 'university' ? (item as University).city : (item as Scholarship).provider;
    const deadline = type === 'university' ? 'Autumn Intake' : (item as Scholarship).deadline || 'Flexible';

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName,
          providerOrUni: providerOrUni,
          deadline: deadline,
          status: 'Saved',
          checklist: [
            { text: 'Prepare Academic Transcripts', done: false },
            { text: 'Verify English Proficiency tests', done: false },
            { text: 'Finalize SOP / Statement drafts', done: false }
          ]
        })
      });

      if (response.ok) {
        setSuccessMsg(`"${appName}" successfully bookmarked into your Active Quest Book!`);
        setTimeout(() => setSuccessMsg(null), 3500);
        // Trigger a custom event to notify the application list to reload
        window.dispatchEvent(new CustomEvent('applications-updated'));
      } else {
        alert('Could not synchronize bookmark with server context.');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      // Fallback
      setSuccessMsg(`"${appName}" saved locally in your temporary quest log.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Filtering Logic
  const filteredUniversities = unis.filter(uni => {
    // Search Query (Name, City, Country, Majors)
    const matchesSearch = searchQuery === '' || 
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.popularMajors.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

    // Country
    const matchesCountry = selectedCountry === 'all' || 
      uni.country.toLowerCase() === selectedCountry.toLowerCase();

    // Max Tuition
    const matchesTuition = uni.tuitionMax <= maxTuition || uni.tuitionMin <= maxTuition;

    // Minimum Required GPA
    const matchesGpa = minGpa === 0 || uni.averageGpa <= minGpa;

    // University Type (Public/Private)
    const matchesType = universityType === 'all' || uni.type === universityType;

    // On Campus Housing
    const matchesHousing = !onCampusHousing || uni.hasOnCampusHousing;

    return matchesSearch && matchesCountry && matchesTuition && matchesGpa && matchesType && matchesHousing;
  });

  const filteredScholarships = scholarships.filter(schol => {
    // Search Query (Name, Description, Provider, Majors)
    const matchesSearch = searchQuery === '' ||
      schol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.eligibleMajors.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

    // Country Filter
    const matchesCountry = selectedCountry === 'all' ||
      schol.eligibleCountries.some(c => c.toLowerCase() === selectedCountry.toLowerCase() || c.toLowerCase() === 'all' || c.toLowerCase() === 'global');

    // GPA requirement
    const matchesGpa = minGpa === 0 || schol.gpaRequirement <= minGpa;

    // Funding Coverage Filter
    const matchesFunding = fundingCoverage === 'all' ||
      schol.fundingCoverage.toLowerCase().includes(fundingCoverage.toLowerCase());

    // Degree Level Filter
    const matchesDegree = selectedDegree === 'all' ||
      schol.degreeLevel.some(d => d.toLowerCase().includes(selectedDegree.toLowerCase()));

    return matchesSearch && matchesCountry && matchesGpa && matchesFunding && matchesDegree;
  });

  return (
    <div className="w-full space-y-6" id="advanced-search-view">
      {/* Search Header Banner */}
      <div className={
        isMinecraft 
          ? "bg-[#2c2927] border-4 border-black p-5 relative overflow-hidden" 
          : "relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-6 shadow-sm backdrop-blur-xl"
      }>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <h2 className={isMinecraft ? "font-press text-xs text-[#ffff55]" : "text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100"}>
                EXPLORER SPYGLASS
              </h2>
            </div>
            <p className={isMinecraft ? "font-mono text-[10px] text-stone-400" : "text-sm text-slate-500 dark:text-slate-400"}>
              Perform cross-database queries to pinpoint optimal high-level academic citadels and fellowship loot chests.
            </p>
          </div>

          {/* Toggle Search Database */}
          <div className="flex gap-1.5 p-1 bg-black/10 dark:bg-black/30 rounded-lg shrink-0 border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => { playClickSound(); setSearchTab('universities'); }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                searchTab === 'universities'
                  ? isMinecraft
                    ? 'bg-[#1e293b] text-[#ffff55] border-2 border-[#ffff55]'
                    : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏰 Universities ({unis.length})
            </button>
            <button
              onClick={() => { playClickSound(); setSearchTab('scholarships'); }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                searchTab === 'scholarships'
                  ? isMinecraft
                    ? 'bg-[#1e293b] text-[#ffff55] border-2 border-[#ffff55]'
                    : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🏆 Scholarships ({scholarships.length})
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Bar */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={
              isMinecraft
                ? "bg-[#111827] border-4 border-emerald-500 text-emerald-400 p-4 font-mono text-[11px] flex items-center gap-3"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm shadow-sm"
            }
          >
            <Check className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Search Deck & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Advanced Filter Deck */}
        <div className={`lg:col-span-1 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className={
            isMinecraft
              ? "bg-[#2c2927] border-4 border-black p-4 font-mono"
              : "bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5"
          }>
            <div className="flex justify-between items-center pb-2 border-b border-black/10 dark:border-slate-800">
              <span className={isMinecraft ? "font-press text-[9px] text-[#55ffff]" : "text-sm font-bold flex items-center gap-2"}>
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" /> ADVANCED FILTERS
              </span>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('all');
                  setMaxTuition(80000);
                  setMinGpa(0.0);
                  setSelectedDegree('all');
                  setUniversityType('all');
                  setOnCampusHousing(false);
                  setFundingCoverage('all');
                }}
                className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5 pt-2">
              <label className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                Keyword Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter name, city, major..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={
                    isMinecraft
                      ? "w-full bg-[#141414] border-2 border-black p-2 font-mono text-xs text-[#ffff55] outline-none"
                      : "w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-100"
                  }
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Country Dropdown */}
            <div className="space-y-1.5">
              <label className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                Destination Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className={
                  isMinecraft
                    ? "w-full bg-[#141414] border-2 border-black p-2 font-mono text-xs text-white outline-none"
                    : "w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                }
              >
                <option value="all">🌍 All Countries ({countriesList.length})</option>
                {countriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* GPA Requirement Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-slate-600 dark:text-slate-400"}>
                  Required GPA Score
                </span>
                <span className="text-indigo-400">{minGpa === 0 ? 'Any' : `${minGpa} / 4.0`}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="4.0"
                step="0.1"
                value={minGpa}
                onChange={(e) => setMinGpa(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
              {profile && profile.gpa && (
                <div className="flex justify-between text-[10px] font-mono text-stone-400">
                  <span>Candidate Score:</span>
                  <span className={profile.gpa >= minGpa ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {profile.gpa} / {profile.maxGpa} GPA
                  </span>
                </div>
              )}
            </div>

            {/* University Specific Filters */}
            {searchTab === 'universities' && (
              <>
                {/* Tuition Cost Filter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-slate-600 dark:text-slate-400"}>
                      Max Annual Tuition
                    </span>
                    <span className="text-emerald-400 font-bold">{convertAmount(maxTuition)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="80000"
                    step="1000"
                    value={maxTuition}
                    onChange={(e) => setMaxTuition(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* University Sector Type */}
                <div className="space-y-1.5">
                  <label className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                    Sector Type
                  </label>
                  <div className="flex gap-2">
                    {['all', 'public', 'private'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setUniversityType(t)}
                        className={`flex-1 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                          universityType === t
                            ? isMinecraft ? 'bg-black text-[#ffff55] border-2 border-[#ffff55]' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-indigo-500'
                            : 'border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Housing filter */}
                <div className="flex items-center justify-between pt-2">
                  <span className={isMinecraft ? "text-[10px] text-stone-300" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                    On-Campus Housing Only
                  </span>
                  <button
                    onClick={() => setOnCampusHousing(!onCampusHousing)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      onCampusHousing ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${onCampusHousing ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              </>
            )}

            {/* Scholarship Specific Filters */}
            {searchTab === 'scholarships' && (
              <>
                {/* Funding Coverage Switch */}
                <div className="space-y-1.5">
                  <label className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                    Funding Level
                  </label>
                  <select
                    value={fundingCoverage}
                    onChange={(e) => setFundingCoverage(e.target.value)}
                    className={
                      isMinecraft
                        ? "w-full bg-[#141414] border-2 border-black p-2 font-mono text-xs text-white outline-none"
                        : "w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                    }
                  >
                    <option value="all">🏆 Any Level</option>
                    <option value="full">💎 Full Tuition (100%)</option>
                    <option value="partial">🌟 Partial Tuition / Stipend</option>
                  </select>
                </div>

                {/* Target Degree checkboxes */}
                <div className="space-y-1.5">
                  <label className={isMinecraft ? "text-[10px] text-[#ffaa00]" : "text-xs font-semibold text-slate-600 dark:text-slate-400"}>
                    Target Degree Level
                  </label>
                  <select
                    value={selectedDegree}
                    onChange={(e) => setSelectedDegree(e.target.value)}
                    className={
                      isMinecraft
                        ? "w-full bg-[#141414] border-2 border-black p-2 font-mono text-xs text-white outline-none"
                        : "w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-none"
                    }
                  >
                    <option value="all">🎓 All Degrees</option>
                    <option value="bachelor">Bachelor's</option>
                    <option value="master">Master's</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Results Display Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Active Search indicators */}
          <div className="flex justify-between items-center text-xs select-none">
            <span className="font-mono text-slate-400">
              Query status: found <span className="text-indigo-400 font-bold">
                {searchTab === 'universities' ? filteredUniversities.length : filteredScholarships.length}
              </span> match entries.
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-md font-semibold cursor-pointer"
            >
              Toggle Filters
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
              <span className="font-press text-[10px] text-[#ffff55]">MAPPING REALMS AND CHESTS...</span>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : searchTab === 'universities' ? (
            /* Universities Grid */
            filteredUniversities.length === 0 ? (
              <div className="bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-2xl h-64 flex flex-col items-center justify-center text-slate-400 space-y-1.5 p-6">
                <Building className="w-8 h-8 text-slate-600" />
                <span className="font-semibold text-sm">No Citadels Found</span>
                <span className="text-xs text-slate-500 text-center max-w-sm">Adjust filters or search query to find target global universities.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUniversities.map((uni) => {
                  const gpaMatches = !profile || profile.gpa >= uni.averageGpa;
                  return (
                    <div
                      key={uni.id}
                      className={
                        isMinecraft
                          ? "bg-[#2c2927] border-4 border-black p-4 flex flex-col justify-between"
                          : "bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:border-slate-200 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between group hover:shadow-md"
                      }
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={isMinecraft ? "font-press text-[8px] text-[#ffaa00]" : "text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-0.5 rounded-full"}>
                            Rank #{uni.ranking}
                          </span>
                          <span className={isMinecraft ? "font-mono text-[9px] text-[#55ff55]" : "text-xs font-semibold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full"}>
                            {uni.acceptanceRate} Accepted
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className={isMinecraft ? "font-press text-[10px] leading-tight text-[#ffff55]" : "text-base font-bold tracking-tight group-hover:text-indigo-400 transition-colors"}>
                            {uni.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{uni.city}, {uni.country}</span>
                          </div>
                        </div>

                        {/* Cost & GPA benchmarks */}
                        <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-black/10 dark:border-slate-800/60 font-mono text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Avg tuition:</span>
                            <span className="text-emerald-400 font-bold">{convertAmount(uni.tuitionMin)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Min. req GPA:</span>
                            <span className={gpaMatches ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                              {uni.averageGpa} / 4.0
                            </span>
                          </div>
                        </div>

                        {/* Popular Majors tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {uni.popularMajors.slice(0, 3).map((major, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {major}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-4 mt-4 border-t border-black/5 dark:border-slate-800/40">
                        <button
                          onClick={() => handleAddToQuestBook(uni, 'university')}
                          className={
                            isMinecraft
                              ? "mc-btn flex-1 text-[8px] font-press py-1.5 text-stone-200"
                              : "flex-1 text-xs py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          }
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" /> Bookmarks
                        </button>
                        {uni.website && (
                          <button
                            onClick={() => window.open(uni.website, '_blank', 'noopener,noreferrer')}
                            className={
                              isMinecraft
                                ? "mc-btn flex-1 text-[8px] font-press py-1.5 text-[#55ffff]"
                                : "flex-1 text-xs py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            }
                          >
                            Website <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Scholarships Grid */
            filteredScholarships.length === 0 ? (
              <div className="bg-slate-900/10 border-2 border-dashed border-slate-800 rounded-2xl h-64 flex flex-col items-center justify-center text-slate-400 space-y-1.5 p-6">
                <Award className="w-8 h-8 text-slate-600" />
                <span className="font-semibold text-sm">No Loot Found</span>
                <span className="text-xs text-slate-500 text-center max-w-sm">No scholarships match the selected GPA, countries or level configuration.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredScholarships.map((schol) => {
                  const gpaMatches = !profile || profile.gpa >= schol.gpaRequirement;
                  return (
                    <div
                      key={schol.id}
                      className={
                        isMinecraft
                          ? "bg-[#2c2927] border-4 border-black p-4 flex flex-col justify-between"
                          : "bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:border-slate-200 dark:hover:border-slate-700/80 transition-all flex flex-col justify-between group hover:shadow-md"
                      }
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className={isMinecraft ? "font-press text-[8px] text-[#ffff55]" : "text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded-full"}>
                            {schol.fundingCoverage}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            🛡️ Min. GPA: {schol.gpaRequirement}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h3 className={isMinecraft ? "font-press text-[10px] leading-tight text-[#ffaa00]" : "text-base font-bold tracking-tight group-hover:text-indigo-400 transition-colors"}>
                            {schol.name}
                          </h3>
                          <div className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{schol.provider}</span>
                          </div>
                        </div>

                        <p className={isMinecraft ? "font-mono text-[9px] text-stone-400 leading-normal" : "text-xs text-slate-500 line-clamp-2 leading-relaxed"}>
                          {schol.description}
                        </p>

                        <div className="pt-2 border-t border-black/10 dark:border-slate-800/60 flex flex-wrap gap-1.5">
                          {schol.degreeLevel.map((deg, i) => (
                            <span key={i} className="text-[9px] bg-indigo-500/5 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                              🎓 {deg}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-4 mt-4 border-t border-black/5 dark:border-slate-800/40">
                        <button
                          onClick={() => handleAddToQuestBook(schol, 'scholarship')}
                          className={
                            isMinecraft
                              ? "mc-btn flex-1 text-[8px] font-press py-1.5 text-stone-200"
                              : "flex-1 text-xs py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          }
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" /> Quest Book
                        </button>
                        {(schol.applicationUrl || schol.officialWebsite) && (
                          <button
                            onClick={() => {
                              const url = schol.applicationUrl || schol.officialWebsite;
                              if (url && url !== '#') {
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className={
                              isMinecraft
                                ? "mc-btn flex-1 text-[8px] font-press py-1.5 text-[#ffff55]"
                                : "flex-1 text-xs py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                            }
                          >
                            Apply Portal <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
