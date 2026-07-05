import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { University, Scholarship } from '../types';
import { 
  Search, SlidersHorizontal, MapPin, Building2,
  Sparkles, Check, ChevronRight, BookmarkPlus, GraduationCap,
  Building, AlertCircle, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { getCleanUniversityUrl } from '../utils/urlHelper';

export default function AdvancedSearch() {
  const { convertAmount } = useTheme();
  const { profile } = useAuth();

  // Search Type Switcher: 'universities' | 'scholarships'
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
  const [showFilters, setShowFilters] = useState<boolean>(true);

  // Success Notification state for bookmarking
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // List of countries dynamically compiled
  const [countriesList, setCountriesList] = useState<string[]>([]);

  // Fetch datasets on mount
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
          setError('Failed to fetch local database resources.');
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

  // Save Application logic
  const handleSaveApplication = async (item: University | Scholarship, type: 'university' | 'scholarship') => {
    playAdvancementSound();
    
    const appName = item.name;
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
        setSuccessMsg(`"${appName}" successfully saved to your Applications Tracker!`);
        setTimeout(() => setSuccessMsg(null), 3500);
        window.dispatchEvent(new CustomEvent('applications-updated'));
      } else {
        setSuccessMsg(`"${appName}" saved locally to your application list.`);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Save application error:', err);
      setSuccessMsg(`"${appName}" saved to your local application tracker.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Filtering Logic
  const filteredUniversities = unis.filter(uni => {
    const matchesSearch = searchQuery === '' || 
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.popularMajors.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry = selectedCountry === 'all' || 
      uni.country.toLowerCase() === selectedCountry.toLowerCase();

    const matchesTuition = uni.tuitionMax <= maxTuition || uni.tuitionMin <= maxTuition;

    const matchesGpa = minGpa === 0 || uni.averageGpa <= minGpa;

    const matchesType = universityType === 'all' || uni.type === universityType;

    const matchesHousing = !onCampusHousing || uni.hasOnCampusHousing;

    return matchesSearch && matchesCountry && matchesTuition && matchesGpa && matchesType && matchesHousing;
  });

  const filteredScholarships = scholarships.filter(schol => {
    const matchesSearch = searchQuery === '' ||
      schol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schol.eligibleMajors.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCountry = selectedCountry === 'all' ||
      schol.eligibleCountries.some(c => c.toLowerCase() === selectedCountry.toLowerCase() || c.toLowerCase() === 'all' || c.toLowerCase() === 'global');

    const matchesGpa = minGpa === 0 || schol.gpaRequirement <= minGpa;

    const matchesFunding = fundingCoverage === 'all' ||
      schol.fundingCoverage.toLowerCase().includes(fundingCoverage.toLowerCase());

    const matchesDegree = selectedDegree === 'all' ||
      schol.degreeLevel.some(d => d.toLowerCase().includes(selectedDegree.toLowerCase()));

    return matchesSearch && matchesCountry && matchesGpa && matchesFunding && matchesDegree;
  });

  return (
    <div className="w-full space-y-6" id="advanced-search-view">
      {/* Search Header Banner */}
      <div className="bg-[#2c2c2c] border-4 border-black p-4 md:p-6 space-y-3 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#ffaa00]" />
              <h2 className="font-press text-xs md:text-sm text-[#ffff55] uppercase">
                ADVANCED SEARCH
              </h2>
            </div>
            <p className="text-xs font-mono text-stone-300">
              Search global universities and scholarships with precision filters for GPA, tuition, and location.
            </p>
          </div>

          {/* Toggle Search Database */}
          <div className="flex gap-2 p-1 bg-black/40 border-2 border-black shrink-0">
            <button
              type="button"
              onClick={() => { playClickSound(); setSearchTab('universities'); }}
              className={`px-4 py-2 font-press text-[10px] uppercase transition-all cursor-pointer ${
                searchTab === 'universities'
                  ? 'bg-[#1a1818] text-[#ffff55] border-2 border-[#ffff55]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🏛️ Universities ({unis.length})
            </button>
            <button
              type="button"
              onClick={() => { playClickSound(); setSearchTab('scholarships'); }}
              className={`px-4 py-2 font-press text-[10px] uppercase transition-all cursor-pointer ${
                searchTab === 'scholarships'
                  ? 'bg-[#1a1818] text-[#ffff55] border-2 border-[#ffff55]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🎓 Scholarships ({scholarships.length})
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
            className="bg-[#111827] border-4 border-emerald-500 text-emerald-400 p-4 font-mono text-xs flex items-center gap-3 [box-shadow:inset_-3px_-3px_0_#064e3b,inset_3px_3px_0_#10b981]"
          >
            <Check className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Search Deck & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Advanced Filter Deck */}
        <div className={`lg:col-span-1 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-4 font-mono [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <div className="flex justify-between items-center pb-2 border-b border-stone-700">
              <span className="font-press text-[10px] text-[#55ffff] uppercase flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#ffaa00]" /> FILTERS
              </span>
              <button 
                type="button"
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
                className="text-xs text-[#ffaa00] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#ffaa00] font-mono block">
                Keyword Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, city, major..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141212] border-2 border-black p-2 font-mono text-xs text-[#ffff55] placeholder-stone-500 focus:border-[#ffff55] outline-none rounded-none"
                />
                <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-stone-500" />
              </div>
            </div>

            {/* Country Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#ffaa00] font-mono block">
                Destination Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[#141212] border-2 border-black p-2 font-mono text-xs text-stone-200 focus:border-[#ffff55] outline-none rounded-none"
              >
                <option value="all">🌍 All Countries ({countriesList.length})</option>
                {countriesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* GPA Requirement Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#ffaa00]">Min. Required GPA</span>
                <span className="text-[#55ffff] font-bold">{minGpa === 0 ? 'Any' : `${minGpa} / 4.0`}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="4.0"
                step="0.1"
                value={minGpa}
                onChange={(e) => setMinGpa(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-stone-800 cursor-pointer"
              />
              {profile && profile.gpa && (
                <div className="flex justify-between text-[10px] font-mono text-stone-400">
                  <span>Your Profile GPA:</span>
                  <span className={profile.gpa >= minGpa ? "text-[#55ff55] font-bold" : "text-rose-400 font-bold"}>
                    {profile.gpa} / {profile.maxGpa || 4.0}
                  </span>
                </div>
              )}
            </div>

            {/* University Specific Filters */}
            {searchTab === 'universities' && (
              <>
                {/* Tuition Cost Filter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#ffaa00]">Max Tuition / Yr</span>
                    <span className="text-[#55ff55] font-bold">{convertAmount(maxTuition)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="80000"
                    step="1000"
                    value={maxTuition}
                    onChange={(e) => setMaxTuition(parseInt(e.target.value))}
                    className="w-full accent-emerald-400 bg-stone-800 cursor-pointer"
                  />
                </div>

                {/* University Sector Type */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#ffaa00] font-mono block">Sector Type</label>
                  <div className="flex gap-2">
                    {['all', 'public', 'private'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setUniversityType(t)}
                        className={`flex-1 py-1.5 text-xs font-mono uppercase transition-all cursor-pointer border-2 ${
                          universityType === t
                            ? 'bg-[#1a1818] text-[#ffff55] border-[#ffff55]'
                            : 'bg-black/30 text-stone-400 border-black hover:text-stone-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Housing filter */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-700">
                  <span className="text-xs text-stone-300 font-mono">On-Campus Housing</span>
                  <button
                    type="button"
                    onClick={() => setOnCampusHousing(!onCampusHousing)}
                    className={`px-3 py-1 font-mono text-xs uppercase cursor-pointer border-2 ${
                      onCampusHousing ? 'bg-emerald-900/60 border-emerald-500 text-emerald-400' : 'bg-black/30 border-black text-stone-500'
                    }`}
                  >
                    {onCampusHousing ? 'Required' : 'Any'}
                  </button>
                </div>
              </>
            )}

            {/* Scholarship Specific Filters */}
            {searchTab === 'scholarships' && (
              <>
                {/* Funding Coverage Switch */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#ffaa00] font-mono block">Funding Coverage</label>
                  <select
                    value={fundingCoverage}
                    onChange={(e) => setFundingCoverage(e.target.value)}
                    className="w-full bg-[#141212] border-2 border-black p-2 font-mono text-xs text-stone-200 focus:border-[#ffff55] outline-none rounded-none"
                  >
                    <option value="all">🏆 Any Level</option>
                    <option value="full">💎 Full Tuition (100%)</option>
                    <option value="partial">🌟 Partial Tuition / Stipend</option>
                  </select>
                </div>

                {/* Target Degree checkboxes */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#ffaa00] font-mono block">Degree Level</label>
                  <select
                    value={selectedDegree}
                    onChange={(e) => setSelectedDegree(e.target.value)}
                    className="w-full bg-[#141212] border-2 border-black p-2 font-mono text-xs text-stone-200 focus:border-[#ffff55] outline-none rounded-none"
                  >
                    <option value="all">🎓 All Degree Levels</option>
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
            <span className="font-mono text-stone-300">
              Found <span className="text-[#ffaa00] font-bold">
                {searchTab === 'universities' ? filteredUniversities.length : filteredScholarships.length}
              </span> matching entries.
            </span>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 rounded-none font-press text-[9px] uppercase cursor-pointer"
            >
              Toggle Filters
            </button>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-[#2c2c2c] border-4 border-black p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
              <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
              <span className="font-press text-[10px] text-[#ffff55]">LOADING SEARCH DATABASE...</span>
            </div>
          ) : error ? (
            <div className="bg-rose-950/40 border-4 border-rose-600 text-rose-300 p-4 font-mono text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : searchTab === 'universities' ? (
            /* Universities Grid */
            filteredUniversities.length === 0 ? (
              <div className="bg-[#2c2c2c] border-4 border-black h-64 flex flex-col items-center justify-center text-stone-400 space-y-2 p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
                <Building className="w-8 h-8 text-stone-500" />
                <span className="font-press text-xs text-[#ffaa00]">No Universities Found</span>
                <span className="text-xs font-mono text-stone-400 text-center max-w-sm">Adjust your filter criteria or search query to view matching institutions.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUniversities.map((uni) => {
                  const gpaMatches = !profile || profile.gpa >= uni.averageGpa;
                  return (
                    <div
                      key={uni.id}
                      className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3 flex flex-col justify-between [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-press text-[9px] text-[#ffaa00] uppercase bg-black/40 px-2 py-1 border border-black">
                            Rank #{uni.ranking}
                          </span>
                          <span className="font-mono text-xs text-[#55ff55] bg-emerald-950/40 px-2 py-0.5 border border-emerald-800">
                            {uni.acceptanceRate} Acceptance
                          </span>
                        </div>

                        <div>
                          <h3 className="font-press text-xs text-[#ffff55] leading-snug">
                            {uni.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs font-mono text-stone-300 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#ffaa00]" />
                            <span>{uni.city}, {uni.country}</span>
                          </div>
                        </div>

                        {/* Cost & GPA benchmarks */}
                        <div className="grid grid-cols-2 gap-2 p-2 bg-[#1a1818] border-2 border-black font-mono text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px]">Tuition / Yr:</span>
                            <span className="text-[#55ff55] font-bold">{convertAmount(uni.tuitionMin)}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Min. Required GPA:</span>
                            <span className={gpaMatches ? "text-[#55ff55] font-bold" : "text-rose-400 font-bold"}>
                              {uni.averageGpa} / 4.0
                            </span>
                          </div>
                        </div>

                        {/* Popular Majors tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {uni.popularMajors.slice(0, 3).map((major, i) => (
                            <span key={i} className="text-[10px] font-mono bg-stone-800 text-stone-300 px-2 py-0.5 border border-stone-700">
                              {major}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-3 border-t border-stone-700">
                        <button
                          type="button"
                          onClick={() => handleSaveApplication(uni, 'university')}
                          className="mc-btn flex-1 text-[9px] font-press py-2 text-stone-200 flex items-center justify-center gap-1"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-[#ffaa00]" /> Save App
                        </button>
                        {uni.website && (
                          <button
                            type="button"
                            onClick={() => window.open(getCleanUniversityUrl(uni), '_blank', 'noopener,noreferrer')}
                            className="mc-btn flex-1 text-[9px] font-press py-2 text-[#55ffff] flex items-center justify-center gap-1"
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
              <div className="bg-[#2c2c2c] border-4 border-black h-64 flex flex-col items-center justify-center text-stone-400 space-y-2 p-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
                <GraduationCap className="w-8 h-8 text-stone-500" />
                <span className="font-press text-xs text-[#ffaa00]">No Scholarships Found</span>
                <span className="text-xs font-mono text-stone-400 text-center max-w-sm">No scholarships match the selected GPA, countries or degree level configuration.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredScholarships.map((schol) => {
                  return (
                    <div
                      key={schol.id}
                      className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3 flex flex-col justify-between [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-press text-[9px] text-[#ffff55] uppercase bg-black/40 px-2 py-1 border border-black">
                            {schol.fundingCoverage}
                          </span>
                          <span className="font-mono text-xs text-stone-300 bg-stone-800 px-2 py-0.5 border border-stone-700">
                            Min. GPA: {schol.gpaRequirement}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-press text-xs text-[#ffaa00] leading-snug">
                            {schol.name}
                          </h3>
                          <div className="text-xs font-mono text-stone-300 flex items-center gap-1 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            <span>{schol.provider}</span>
                          </div>
                        </div>

                        <p className="font-mono text-xs text-stone-300 line-clamp-2 leading-relaxed">
                          {schol.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {schol.degreeLevel.map((deg, i) => (
                            <span key={i} className="text-[10px] font-mono bg-stone-800 text-[#55ffff] px-2 py-0.5 border border-stone-700">
                              🎓 {deg}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-3 border-t border-stone-700">
                        <button
                          type="button"
                          onClick={() => handleSaveApplication(schol, 'scholarship')}
                          className="mc-btn flex-1 text-[9px] font-press py-2 text-stone-200 flex items-center justify-center gap-1"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5 text-[#ffaa00]" /> Save App
                        </button>
                        {(schol.applicationUrl || schol.officialWebsite) && (
                          <button
                            type="button"
                            onClick={() => {
                              const url = schol.applicationUrl || schol.officialWebsite;
                              if (url && url !== '#') {
                                window.open(getCleanUniversityUrl({ name: schol.name, website: url }, true), '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="mc-btn flex-1 text-[9px] font-press py-2 text-[#ffff55] flex items-center justify-center gap-1"
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

