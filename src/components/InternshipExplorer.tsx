import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Globe, DollarSign, Calendar, Sparkles, ExternalLink, ShieldCheck, MapPin, Building, Filter } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useTheme } from '../context/ThemeContext';

export interface InternshipItem {
  id: string;
  name: string;
  provider: string;
  description: string;
  officialWebsite: string;
  applicationUrl: string;
  type: string;
  duration: string;
  stipend: number;
  stipendCurrency: string;
  applicationDeadline: string;
  eligibleCountries: string[];
  eligibleMajors: string[];
  eligibleDegreeLevels: string[];
  minGPA: number;
  country: string;
  region: string;
  isRemote: boolean;
  lastVerified: string;
}

export default function InternshipExplorer() {
  const { convertAmount } = useTheme();

  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);

  useEffect(() => {
    const fetchInternships = async () => {
      setLoading(true);
      try {
        const res = await fetch('/data/internships.json');
        if (res.ok) {
          const data = await res.json();
          setInternships(data);
        }
      } catch (err) {
        console.error("Failed to load internships catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, []);

  const filteredInternships = internships.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.eligibleMajors.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRegion = selectedRegion === 'all' || item.region.toLowerCase() === selectedRegion.toLowerCase();
    const matchesType = selectedType === 'all' || item.type.toLowerCase() === selectedType.toLowerCase();
    const matchesRemote = !showRemoteOnly || item.isRemote;

    return matchesSearch && matchesRegion && matchesType && matchesRemote;
  });

  const handleApplyClick = (url: string, name?: string) => {
    playClickSound();
    if (url && url !== '#' && !url.includes('placeholder')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent((name || 'Internship') + ' apply official website')}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-internship-explorer-view">
      
      {/* Header Banner */}
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-press text-[12px] text-[#55ff55] uppercase flex items-center gap-2 mc-text-shadow">
              <Briefcase className="w-5 h-5 text-[#55ff55]" /> GLOBAL FELLOWSHIP & INTERNSHIP VAULT
            </h3>
            <p className="text-xs text-stone-350 font-mono mt-1">
              Curated paid technical internships, research fellowships, CERN labs, UN diplomatic posts, and corporate industry residencies.
            </p>
          </div>
          <span className="bg-emerald-950 border-2 border-[#55ff55] text-[#55ff55] font-press text-[8px] px-2.5 py-1 uppercase shrink-0">
            💼 Verified Opportunities
          </span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Filter by title, company, major (e.g. Computer Science, Google, CERN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/45 border-4 border-stone-800 text-stone-200 pl-10 pr-4 py-2 text-xs font-mono focus:border-[#ffff55] outline-none"
            />
          </div>

          <select
            value={selectedRegion}
            onChange={(e) => { playClickSound(); setSelectedRegion(e.target.value); }}
            className="bg-[#3a3a3a] border-4 border-black text-stone-200 text-xs font-mono px-3 py-2 outline-none select-none"
          >
            <option value="all">🌐 All Regions</option>
            <option value="North America">North America</option>
            <option value="Europe">Europe</option>
            <option value="Asia">Asia</option>
            <option value="Oceania">Oceania</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => { playClickSound(); setSelectedType(e.target.value); }}
            className="bg-[#3a3a3a] border-4 border-black text-stone-200 text-xs font-mono px-3 py-2 outline-none select-none"
          >
            <option value="all">💰 All Compensation</option>
            <option value="paid">Fully Paid</option>
            <option value="stipend">Stipend Supported</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1 font-mono text-xs text-stone-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRemoteOnly}
              onChange={(e) => { playClickSound(); setShowRemoteOnly(e.target.checked); }}
              className="accent-[#55ff55] w-4 h-4"
            />
            <span>Show Remote / Virtual Positions Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">FETCHING GLOBAL INTERNSHIP REGISTRY...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1 font-mono text-xs text-stone-400">
            <span>INDEXED POSITIONS FOUND: <strong className="text-[#ffff55] font-press text-[10px]">{filteredInternships.length}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInternships.map((item) => (
              <div
                key={item.id}
                className="bg-[#2c2c2c] border-4 border-black p-5 flex flex-col justify-between space-y-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] hover:border-stone-500 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-press text-[9px] text-[#ffaa00] uppercase block mc-text-shadow">
                        {item.provider}
                      </span>
                      <h4 className="font-press text-[12px] text-stone-100 mt-1 leading-snug">
                        {item.name}
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-press uppercase shrink-0 ${
                      item.type === 'paid' ? 'bg-emerald-950 text-[#55ff55] border-[#55ff55]' : 'bg-cyan-950 text-[#55ffff] border-[#55ffff]'
                    }`}>
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 font-mono leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div className="bg-black/30 border border-stone-800 p-2 text-stone-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ffaa00]" />
                      <span className="truncate">{item.country} ({item.region})</span>
                    </div>

                    <div className="bg-black/30 border border-stone-800 p-2 text-stone-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#55ff55]" />
                      <span className="truncate font-bold text-[#55ff55]">
                        {item.stipend ? `${item.stipend} ${item.stipendCurrency}` : 'Supported'}
                      </span>
                    </div>

                    <div className="bg-black/30 border border-stone-800 p-2 text-stone-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span className="truncate">Duration: {item.duration}</span>
                    </div>

                    <div className="bg-black/30 border border-stone-800 p-2 text-stone-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Deadline: {item.applicationDeadline}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.eligibleMajors.slice(0, 3).map((major, idx) => (
                      <span key={idx} className="bg-stone-800 text-stone-300 border border-stone-700 text-[9px] font-mono px-2 py-0.5">
                        {major}
                      </span>
                    ))}
                    {item.isRemote && (
                      <span className="bg-purple-950 text-purple-300 border border-purple-500 text-[9px] font-mono px-2 py-0.5 font-bold">
                        🌐 Remote Friendly
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-800">
                  <button
                    onClick={() => handleApplyClick(item.applicationUrl || item.officialWebsite, item.name)}
                    className="w-full bg-[#55ff55] hover:bg-green-400 text-black border-2 border-black font-press text-[9px] py-2.5 uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" /> Apply On Official Portal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
