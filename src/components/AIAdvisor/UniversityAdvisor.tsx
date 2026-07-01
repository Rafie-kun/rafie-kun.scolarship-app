import React, { useState, useEffect } from "react";
import { Sparkles, Building, RefreshCw, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../../context/AuthContext";
import { playClickSound, playAdvancementSound } from "../../utils/sound";

export default function UniversityAdvisor() {
  const { authorizedFetch, rewardPoints, profile, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const [topMatches, setTopMatches] = useState<any[]>([]);
  const [claimedSteps, setClaimedSteps] = useState<Record<string, boolean>>({});
  const [isXpClaimed, setIsXpClaimed] = useState(false);
  const [xpSuccess, setXpSuccess] = useState("");

  const fetchRecommendations = async () => {
    playClickSound();
    setLoading(true);
    setXpSuccess("");
    try {
      const customKey = localStorage.getItem("scholarpath_custom_gemini_key") || "";
      const res = await authorizedFetch("/api/ai/university-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": customKey,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setTopMatches(data.topMatches || []);
      } else {
        throw new Error("Admissions advisor server returned error");
      }
    } catch (e) {
      console.error(e);
      setReport("### 📡 Admissions Consultant Offline\n\nCould not compile your live university recommendations. Please verify your connection or check your profile parameters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchRecommendations();
    }
  }, [isLoggedIn, profile?.gpa, profile?.intendedMajor]);

  const handleClaimXp = async () => {
    if (isXpClaimed) return;
    playAdvancementSound();
    setIsXpClaimed(true);
    await rewardPoints(30, "Completed AI University Admissions Strategy Consultation");
    setXpSuccess("Level Up! +30 Fellowship XP points added to your credentials!");
    setTimeout(() => setXpSuccess(""), 5000);
  };

  const toggleCheckStep = (stepName: string) => {
    playClickSound();
    setClaimedSteps((prev) => ({
      ...prev,
      [stepName]: !prev[stepName],
    }));
  };

  return (
    <div className="space-y-6" id="scholarpath-ai-university-advisor">
      {/* Header Banner */}
      <div className="bg-[#141414] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#0a0a0a,inset_4px_4px_0_#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-[#55ffff] border-2 border-black p-3 [box-shadow:2px_2px_0_#000] text-black">
            <Building className="w-8 h-8 shrink-0" />
          </div>
          <div>
            <h3 className="font-press text-[11px] uppercase text-[#55ffff] tracking-wider mc-text-shadow">
              AI Admissions Consultant
            </h3>
            <p className="text-xs text-stone-300 font-mono mt-1">
              Deep analysis comparing your current academic profile to incoming average standards of global universities.
            </p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="mc-btn px-4 py-2.5 text-[9px] uppercase font-bold text-black bg-[#55ffff] hover:bg-[#3ec4c4] transition-all flex items-center gap-2 self-start md:self-auto"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Recalculate Admissions</span>
        </button>
      </div>

      {xpSuccess && (
        <div className="bg-[#1b2b3a] border-4 border-[#55ffff] text-[#55ffff] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#55ffff] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-press text-[9px]">{xpSuccess}</span>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - top matches list */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#2c2c2c] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <h4 className="font-press text-[9px] text-[#55ffff] uppercase mb-4 tracking-wider border-b border-stone-700 pb-2 flex items-center gap-2">
              🏢 Institutional Scorecard
            </h4>
            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 bg-stone-800 border-2 border-stone-900 animate-pulse" />
                ))}
              </div>
            ) : topMatches.length === 0 ? (
              <p className="text-xs text-stone-400 font-mono">
                No matching institutions indexed. Make sure your intended major and GPA are set on your profile skin!
              </p>
            ) : (
              <div className="space-y-3">
                {topMatches.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#141414] border-2 border-black hover:border-[#55ffff] transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-[11px] font-mono font-bold text-stone-200 line-clamp-1 group-hover:text-[#55ffff]">
                        {item.university.name}
                      </p>
                      <p className="text-[9px] font-mono text-stone-400 mt-0.5 uppercase">
                        Rank #{item.university.ranking} • {item.university.city || "Global"}
                      </p>
                    </div>
                    <div className="bg-[#2c2c2c] border border-black px-2 py-1 text-center shrink-0 ml-2">
                      <span className="text-[10px] font-press text-[#55ff55] mc-text-shadow">
                        {item.matchScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick checklist */}
          <div className="bg-[#2c2c2c] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555]">
            <h4 className="font-press text-[9px] text-[#ffaa00] uppercase mb-3 tracking-wider flex items-center gap-2">
              📋 Admission Checkpoints
            </h4>
            <div className="space-y-3 font-mono text-xs">
              {[
                "Analyze Reach vs Target Assessment",
                "Review Portfolio Case Strategies",
                "Verify Cost & Housing Feasibility",
                "Formulate Application Timeline Plan",
              ].map((milestone) => (
                <div
                  key={milestone}
                  onClick={() => toggleCheckStep(milestone)}
                  className="flex items-center gap-2 cursor-pointer select-none py-1 hover:text-stone-100 text-stone-300"
                >
                  <div
                    className={`w-4 h-4 border-2 border-black flex items-center justify-center shrink-0 ${
                      claimedSteps[milestone] ? "bg-[#55ff55]" : "bg-[#141414]"
                    }`}
                  >
                    {claimedSteps[milestone] && <div className="w-1.5 h-1.5 bg-black" />}
                  </div>
                  <span className={claimedSteps[milestone] ? "line-through text-stone-500" : ""}>
                    {milestone}
                  </span>
                </div>
              ))}
            </div>

            {/* Claim Reward Button */}
            <button
              onClick={handleClaimXp}
              disabled={isXpClaimed}
              className={`w-full mt-4 py-2.5 text-[9px] font-press uppercase tracking-wider border-2 border-black rounded-none ${
                isXpClaimed
                  ? "bg-stone-800 text-stone-500 border-stone-900 cursor-not-allowed"
                  : "bg-[#ffaa00] text-black hover:bg-[#ffbb33]"
              }`}
            >
              {isXpClaimed ? "🏆 Consultant Claimed" : "🎁 Claim Consultation XP"}
            </button>
          </div>
        </div>

        {/* Right column - Admissions Report */}
        <div className="lg:col-span-8">
          <div className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] min-h-[460px] flex flex-col">
            <h4 className="font-press text-[9px] text-[#55ffff] uppercase mb-4 tracking-wider border-b border-stone-700 pb-2 flex items-center gap-2 mc-text-shadow">
              <Sparkles className="w-4 h-4 shrink-0 text-[#55ffff]" /> Advisor Strategy
            </h4>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-[#55ffff]/20 border-t-[#55ffff] animate-spin rounded-none" />
                </div>
                <p className="text-xs text-[#55ffff] font-mono animate-pulse">
                  Gemini core consultant engine compiling institution entry trends...
                </p>
              </div>
            ) : report ? (
              <div className="flex-1 overflow-y-auto pr-1 max-h-[500px]">
                <div className="markdown-body font-mono text-xs text-stone-200 leading-relaxed space-y-3">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <p className="text-xs text-stone-400 font-mono mb-4">
                  No admissions consultation has been loaded yet.
                </p>
                <button
                  onClick={fetchRecommendations}
                  className="mc-btn px-4 py-2.5 text-[9px] uppercase font-bold text-black"
                >
                  Request Advisor Scan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
