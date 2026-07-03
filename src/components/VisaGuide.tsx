import React, { useState, useEffect } from 'react';
import { Compass, Globe, DollarSign, Clock, FileText, CheckCircle, ExternalLink, ShieldCheck, Search, AlertCircle, Sparkles, Briefcase } from 'lucide-react';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export interface VisaItem {
  id: string;
  country: string;
  visaType: string;
  processingTime: string;
  feeUSD: number;
  feeFormatted: string;
  proofOfFundsUSD: number;
  proofOfFundsRequirement: string;
  workPermissions: string;
  postStudyWorkVisa: string;
  keyRequirements: string[];
  officialUrl: string;
  tips: string;
}

export default function VisaGuide() {
  const { profile } = useAuth();
  const { convertAmount } = useTheme();

  const [visas, setVisas] = useState<VisaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [activeVisa, setActiveVisa] = useState<VisaItem | null>(null);

  // Checklist state saved locally per visa
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchVisaData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/data/visa_guide.json');
        if (res.ok) {
          const data = await res.json();
          setVisas(data);
          if (data.length > 0) {
            setActiveVisa(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load visa guide data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVisaData();
  }, []);

  // Filter visas
  const filteredVisas = visas.filter(v => {
    const matchesSearch = v.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.visaType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || v.country.toLowerCase() === selectedCountry.toLowerCase();
    return matchesSearch && matchesCountry;
  });

  const toggleChecklist = (reqIndex: number) => {
    playClickSound();
    const key = `${activeVisa?.id}-${reqIndex}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6" id="scholarpath-visa-guide-view">
      
      {/* Title Header Banner */}
      <div className="mc-window-dark border-4 border-black p-4 text-stone-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-press text-[12px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
              <Compass className="w-5 h-5 text-[#ffff55] animate-spin" /> VISA COMPASS & BORDER PASSAGE
            </h3>
            <p className="text-xs text-stone-350 font-mono mt-1">
              Official student visa requirements, proof of funds thresholds, post-study work permits, and step-by-step embassy application protocols.
            </p>
          </div>
          <span className="bg-indigo-950 border-2 border-indigo-500 text-indigo-300 font-press text-[8px] px-2.5 py-1 uppercase shrink-0">
            🛡️ Official Embassy Matrices
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#2c2c2c] border-4 border-black p-4 space-y-3 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Filter by destination country or visa type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/45 border-4 border-stone-800 text-stone-200 pl-10 pr-4 py-2 text-xs font-mono focus:border-[#ffff55] outline-none"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => { playClickSound(); setSelectedCountry(e.target.value); }}
            className="bg-[#3a3a3a] border-4 border-black text-stone-200 text-xs font-mono px-3 py-2 outline-none select-none"
          >
            <option value="all">🌐 All Target Destinations ({visas.length})</option>
            {visas.map((v) => (
              <option key={v.id} value={v.country}>{v.country}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-8 h-8 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">LOADING BORDER CONTROL BLUEPRINTS...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: List of Country Visas */}
          <div className="space-y-3 lg:col-span-1">
            <h4 className="font-press text-[10px] text-stone-400 uppercase tracking-wider block px-1">
              DESTINATION REALMS ({filteredVisas.length})
            </h4>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredVisas.map((visa) => {
                const isActive = activeVisa?.id === visa.id;
                return (
                  <button
                    key={visa.id}
                    onClick={() => { playAdvancementSound(); setActiveVisa(visa); }}
                    className={`w-full p-3.5 border-4 border-black text-left font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-[#3b3b8c] text-[#ffff55] border-t-[#c9c9ff] border-l-[#c9c9ff] [box-shadow:inset_-4px_-4px_0_#1e1e4a,inset_4px_4px_0_#6262d1]'
                        : 'bg-[#2c2c2c] text-stone-300 hover:bg-stone-800 hover:border-stone-600'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className={`w-4 h-4 ${isActive ? 'text-[#ffff55]' : 'text-stone-400'}`} />
                        <span className="font-bold text-xs uppercase">{visa.country}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 block pl-6">{visa.visaType}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[9px] font-bold block ${isActive ? 'text-green-300' : 'text-stone-400'}`}>
                        {visa.processingTime}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Passport Dossier */}
          {activeVisa ? (
            <div className="lg:col-span-2 bg-[#2c2c2c] border-4 border-black p-5 space-y-6 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
              
              {/* Header section */}
              <div className="border-b-4 border-black pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="font-press text-[9px] text-[#ffaa00] uppercase block mc-text-shadow">
                    PASSPORT PROTOCOL DOSSIER
                  </span>
                  <h3 className="font-press text-[14px] text-stone-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#64e3ff]" /> {activeVisa.country} — {activeVisa.visaType}
                  </h3>
                </div>

                <a
                  href={activeVisa.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClickSound()}
                  className="bg-[#55ff55] hover:bg-green-400 text-black border-2 border-black font-press text-[9px] py-2 px-3 uppercase flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                >
                  <ExternalLink className="w-4 h-4" /> Official Portal
                </a>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="bg-black/40 border-2 border-black p-3 space-y-1 font-mono text-xs">
                  <span className="text-stone-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Embassy Processing Time:
                  </span>
                  <p className="font-bold text-[#ffff55] text-sm">{activeVisa.processingTime}</p>
                </div>

                <div className="bg-black/40 border-2 border-black p-3 space-y-1 font-mono text-xs">
                  <span className="text-stone-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" /> Visa Fee Toll:
                  </span>
                  <p className="font-bold text-[#55ff55] text-sm">{activeVisa.feeFormatted}</p>
                </div>

                <div className="bg-black/40 border-2 border-black p-3 space-y-1 font-mono text-xs sm:col-span-2">
                  <span className="text-stone-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Required Maintenance / Proof of Funds:
                  </span>
                  <p className="font-bold text-stone-200 text-xs leading-relaxed">{activeVisa.proofOfFundsRequirement}</p>
                  <p className="text-[10px] text-[#64e3ff] font-bold pt-1">
                    Estimated Base Threshold: ~{convertAmount(activeVisa.proofOfFundsUSD)} USD
                  </p>
                </div>

              </div>

              {/* Work permissions & Post-study work rights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-stone-900 border border-stone-800 p-3 space-y-1.5">
                  <span className="text-[10px] font-press text-[#ffaa00] uppercase block flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" /> Student Work Rights
                  </span>
                  <p className="text-stone-300 leading-relaxed">{activeVisa.workPermissions}</p>
                </div>

                <div className="bg-stone-900 border border-stone-800 p-3 space-y-1.5">
                  <span className="text-[10px] font-press text-[#a586ff] uppercase block flex items-center gap-1">
                    🎓 Post-Study Work Permit
                  </span>
                  <p className="text-stone-300 leading-relaxed">{activeVisa.postStudyWorkVisa}</p>
                </div>
              </div>

              {/* Document Checklist */}
              <div className="space-y-3 bg-black/30 border-2 border-stone-800 p-4">
                <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#ffff55]" /> Mandatory Document Checklist
                </h4>

                <div className="space-y-2">
                  {activeVisa.keyRequirements.map((req, idx) => {
                    const isDone = !!checkedItems[`${activeVisa.id}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChecklist(idx)}
                        className={`p-2.5 border-2 cursor-pointer font-mono text-xs flex items-center gap-3 transition-colors ${
                          isDone
                            ? 'bg-green-950/40 border-[#55ff55] text-stone-200'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${
                          isDone ? 'border-[#55ff55] bg-green-950 text-[#55ff55]' : 'border-stone-600 bg-black'
                        }`}>
                          {isDone && '✓'}
                        </div>
                        <span className={isDone ? 'line-through text-stone-400' : 'text-stone-200'}>{req}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expert Embassy Tips */}
              <div className="bg-amber-950/30 border-2 border-amber-500/50 p-4 font-mono text-xs space-y-1.5">
                <span className="font-press text-[9px] text-[#ffaa00] uppercase block flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-[#ffaa00]" /> Counselor Embassy Pro-Tip
                </span>
                <p className="text-stone-200 leading-relaxed">{activeVisa.tips}</p>
              </div>

            </div>
          ) : null}

        </div>
      )}

    </div>
  );
}
