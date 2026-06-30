import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Square, Notebook, CheckCircle, Plus, ClipboardList, Trash2, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { getMockApplications, saveMockApplications } from '../services/mockDataService';

export default function ApplicationsView() {
  const { authorizedFetch, rewardPoints, profile, user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [success, setSuccess] = useState('');
  const [usingLocalMock, setUsingLocalMock] = useState(false);

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchApps = async () => {
    const userSuffix = user || 'guest';
    try {
      const res = await authorizedFetch('/api/applications');
      let data = [];
      if (res.ok) {
        data = await res.json();
      }
      
      if (!data || data.length === 0 || profile?.offlineMode) {
        data = getMockApplications(userSuffix);
        setUsingLocalMock(true);
      } else {
        setUsingLocalMock(false);
      }

      setApps(data);
      if (data.length > 0 && !selectedApp) {
        setSelectedApp(data[0]);
      } else if (selectedApp) {
        const updated = data.find((a: Application) => a.id === selectedApp?.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (e) {
      console.warn("API failed, using local mock data", e);
      const mockData = getMockApplications(userSuffix);
      setUsingLocalMock(true);
      setApps(mockData);
      if (mockData.length > 0 && !selectedApp) {
        setSelectedApp(mockData[0]);
      } else if (selectedApp) {
        const updated = mockData.find((a: Application) => a.id === selectedApp?.id);
        if (updated) setSelectedApp(updated);
      }
    }
  };

  useEffect(() => {
    fetchApps().then(() => setLoading(false));
  }, [user]);

  const handleUpdateApp = async (updatedApp: Application) => {
    const userSuffix = user || 'guest';
    if (usingLocalMock) {
      const updatedApps = apps.map(a => a.id === updatedApp.id ? updatedApp : a);
      saveMockApplications(updatedApps, userSuffix);
      setApps(updatedApps);
      setSelectedApp(updatedApp);
      return;
    }

    try {
      const res = await authorizedFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: updatedApp })
      });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
        setSelectedApp(updatedApp);
      }
    } catch (e) {
      console.error(e);
      // Fallback to local
      const updatedApps = apps.map(a => a.id === updatedApp.id ? updatedApp : a);
      saveMockApplications(updatedApps, userSuffix);
      setApps(updatedApps);
      setSelectedApp(updatedApp);
      setUsingLocalMock(true);
    }
  };

  const toggleChecklist = async (idx: number) => {
    playClickSound();
    if (!selectedApp) return;
    
    const checklist = [...selectedApp.checklist];
    checklist[idx].done = !checklist[idx].done;
    
    if (checklist[idx].done) {
      playAdvancementSound();
      setSuccess(`Completed step: "${checklist[idx].text}"! (+5 Fellowship XP!)`);
      
      const actionName = `Admissions Step Done: ${checklist[idx].text}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        await rewardPoints(5, actionName);
      }
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
    }

    handleUpdateApp({ ...selectedApp, checklist });
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!selectedApp || !newChecklistItem.trim()) return;

    const checklist = [...selectedApp.checklist, { text: newChecklistItem.trim(), done: false }];
    handleUpdateApp({ ...selectedApp, checklist });
    setNewChecklistItem('');
  };

  const handleStatusChange = async (status: Application['status']) => {
    playClickSound();
    if (!selectedApp) return;

    if (status === 'Won' || status === 'Accepted') {
      playAdvancementSound();
      setSuccess(`🏅 ADMISSIONS GLORY! Status marked as ${status.toUpperCase()}! (+50 XP!)`);
      
      const actionName = `Fellowship Accepted: ${selectedApp.name}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        await rewardPoints(50, actionName, "Fellowship Winner");
      }
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 5000);
    }

    handleUpdateApp({ ...selectedApp, status });
  };

  const handleNotesChange = (notes: string) => {
    if (!selectedApp) return;
    handleUpdateApp({ ...selectedApp, notes });
  };

  const handleCreateNewAppManual = async () => {
    playClickSound();
    
    const name = window.prompt("Enter the name of the scholarship/fellowship you want to track:");
    if (name === null) return; 
    const finalName = name.trim() || 'Custom Admissions Pursuit';
    
    const provider = window.prompt("Enter the provider / university name:");
    if (provider === null) return; 
    const finalProvider = provider.trim() || 'Your Specified Board';

    const newApp: Application = {
      id: 'app-' + Date.now(),
      name: finalName,
      providerOrUni: finalProvider,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Saved',
      notes: 'No research logs recorded yet. Track curriculum syllabus requirements and reference letter draft copies here.',
      checklist: [
        { text: 'Research eligibility requirements', done: false },
        { text: 'Prepare academic transcripts', done: false },
        { text: 'Write Statement of Purpose', done: false }
      ]
    };

    if (usingLocalMock) {
      const updatedApps = [...apps, newApp];
      saveMockApplications(updatedApps);
      setApps(updatedApps);
      setSelectedApp(newApp);
      setSuccess(`Custom quest "${finalName}" added to tracked ledger! (+10 XP)`);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
      return;
    }

    try {
      const res = await authorizedFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: newApp })
      });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
        const newlyCreated = data.find((a: Application) => a.id === newApp.id) || data[data.length - 1] || newApp;
        setSelectedApp(newlyCreated);
        
        const actionName = `Added custom track: ${finalName}`;
        if (!rewardedActionsRef.current.has(actionName)) {
          rewardedActionsRef.current.add(actionName);
          await rewardPoints(10, actionName, "Quest Tracker");
        }
        
        setSuccess(`Custom quest "${finalName}" added to tracked ledger! (+10 XP)`);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
      // Fallback to local
      const updatedApps = [...apps, newApp];
      saveMockApplications(updatedApps);
      setApps(updatedApps);
      setSelectedApp(newApp);
      setUsingLocalMock(true);
      setSuccess(`Custom quest "${finalName}" added locally!`);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
    }
  };

  const handleDeleteApp = async (id: string) => {
    playClickSound();
    if (!window.confirm("⚠️ Are you sure you want to abandon/delete this admissions quest tracker? All research logbooks for this slot will be swept away.")) {
      return;
    }
    
    if (usingLocalMock) {
      const updatedApps = apps.filter(a => a.id !== id);
      saveMockApplications(updatedApps);
      setApps(updatedApps);
      if (updatedApps.length > 0) {
        setSelectedApp(updatedApps[0]);
      } else {
        setSelectedApp(null);
      }
      setSuccess('🌿 Tracking quest abandoned successfully.');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
      return;
    }

    try {
      const res = await authorizedFetch(`/api/applications/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setApps(data);
        if (data.length > 0) {
          setSelectedApp(data[0]);
        } else {
          setSelectedApp(null);
        }
        setSuccess('🌿 Tracking quest abandoned successfully.');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
      }
    } catch (e) {
      console.error("Failed to delete application tracker:", e);
      // Fallback
      const updatedApps = apps.filter(a => a.id !== id);
      saveMockApplications(updatedApps);
      setApps(updatedApps);
      if (updatedApps.length > 0) setSelectedApp(updatedApps[0]);
      else setSelectedApp(null);
      setUsingLocalMock(true);
      setSuccess('🌿 Tracking quest abandoned locally.');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-applications-v2">
      
      {/* Visual Header */}
      <div className="mc-window border-4 border-black p-5 text-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-stone-900" /> QUEST BOOK (APPLICATIONS)
          </h3>
          <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
            Configure application deadlines, manage checklist steps, customize logs, and track admission checkpoints to advance through status registers.
          </p>
        </div>
        <button
          onClick={handleCreateNewAppManual}
          className="mc-btn px-4 py-2.5 text-[9px] uppercase font-bold text-[#ffff55]"
        >
          Add Custom Track
        </button>
      </div>

      {success && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5 text-[#55ff55] shrink-0" />
          <span className="mc-text-shadow">{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">LOADING ADMISSIONS BOOK...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main program listing */}
          <div className="md:col-span-5 bg-[#2c2c2c] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-3">
            <h4 className="font-press text-[9px] text-[#ffff55] uppercase pb-2 border-b-2 border-black mc-text-shadow">Tracking ledger</h4>
            
            <div className="space-y-2 overflow-y-auto max-h-[450px]">
              {apps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => { setSelectedApp(app); playClickSound(); }}
                  className={`w-full text-left p-3 cursor-pointer border-4 font-mono flex flex-col gap-1.5 transition-all ${
                     selectedApp?.id === app.id 
                       ? 'bg-[#3b3b3b] border-[#ffff55] [box-shadow:inset_-2px_-2px_0_rgba(0,0,0,0.4)]' 
                       : 'bg-[#1e1c1b] border-stone-900 hover:border-[#8c8c8c]'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] uppercase text-stone-400 font-bold truncate max-w-[140px]">{app.providerOrUni}</span>
                    <span className={`text-[8px] px-2 font-press uppercase tracking-wider h-5 flex items-center ${
                      app.status === 'Won' || app.status === 'Accepted'
                        ? 'bg-emerald-900/30 text-[#55ff55] border border-[#55ff55]/20'
                        : app.status === 'In Progress'
                        ? 'bg-amber-900/30 text-[#ffaa00] border border-[#ffaa00]/20'
                        : 'bg-stone-800 text-stone-300 border border-stone-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-stone-200 line-clamp-1">{app.name}</h5>
                  <span className="text-[10px] text-stone-400 font-mono">DEADLINE: {app.deadline}</span>
                </button>
              ))}

              {apps.length === 0 && (
                <div className="text-center py-12 text-[10px] font-press text-stone-400 leading-normal uppercase">
                  No active tracked quests.<br/>Browse the Loot Registry to begin!
                </div>
              )}
            </div>
          </div>

          {/* Detailed item workbench */}
          {selectedApp ? (
            <div className="md:col-span-7 bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] space-y-5">
              <div className="border-b-2 border-black pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-press text-[12px] text-[#ffff55] leading-normal mc-text-shadow">{selectedApp.name}</h4>
                  <p className="text-xs text-stone-300 font-mono mt-1">Issuer: {selectedApp.providerOrUni} | Due: {selectedApp.deadline}</p>
                </div>
                <button
                  onClick={() => handleDeleteApp(selectedApp.id)}
                  className="bg-red-950 hover:bg-red-900 border-2 border-black px-3 py-1.5 text-[9px] text-red-200 uppercase font-bold tracking-wider rounded-none cursor-pointer flex items-center gap-1 shrink-0"
                  title="Abandon this scholarship Quest"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" /> Abandon Quest
                </button>
              </div>

              {/* Status workflow dropdown */}
              <div className="p-4 bg-[#141414] border-2 border-black space-y-2 font-mono text-xs">
                <span className="text-[9px] font-press uppercase text-[#ffaa00] mc-text-shadow block">Quest Stage:</span>
                <div className="flex flex-wrap gap-2">
                  {(['Saved', 'In Progress', 'Submitted', 'Accepted', 'Won'] as Application['status'][]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`px-3 py-1.5 cursor-pointer text-[9px] font-bold rounded-none border-2 leading-none transition-all ${
                        selectedApp.status === st 
                          ? 'bg-[#ffff55] text-black border-black font-press text-[8px]' 
                          : 'bg-[#2c2c2c] text-stone-300 border-stone-800 hover:border-stone-500'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklists items board */}
              <div className="space-y-3 font-mono">
                <h5 className="font-press text-[9px] text-[#ffff55] uppercase mc-text-shadow">Sub-Quests Chest</h5>
                
                <div className="space-y-2 text-xs">
                  {selectedApp.checklist.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleChecklist(idx)}
                      className="w-full text-left p-3 cursor-pointer bg-[#1e1c1b] border-2 border-black hover:border-stone-500 transition-colors flex items-center gap-3 rounded-none"
                    >
                      {item.done ? (
                        <CheckSquare className="w-5 h-5 text-[#55ff55] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-stone-500 shrink-0" />
                      )}
                      <span className={`leading-relaxed ${item.done ? 'line-through text-stone-500' : 'text-stone-300'}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}

                  {/* Add customized Checklist task */}
                  <form onSubmit={addChecklistItem} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Inject custom subtask (e.g. 'Draft Motivation Letter' )..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      className="flex-1 bg-[#141414] border-2 border-black px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-[#ffff55]"
                    />
                    <button
                      type="submit"
                      className="mc-btn px-2.5 py-1.5"
                    >
                      <Plus className="w-4 h-4 text-[#ffff55]" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Research Notes panel */}
              <div className="space-y-2 font-mono text-xs">
                <span className="font-press text-[9px] text-[#ffff55] uppercase flex items-center gap-1 mc-text-shadow">
                  <Notebook className="w-4 h-4 text-[#55ffff]" /> Ledger Research Logbook
                </span>
                <textarea
                  value={selectedApp.notes || ''}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Record admissions faculty replies, professor portfolios, GRE syllabus indices, or document criteria here..."
                  className="w-full bg-[#141414] border-2 border-black p-3 min-h-[100px] text-stone-350 focus:outline-none focus:border-[#ffff55]"
                />
              </div>

            </div>
          ) : (
            <div className="md:col-span-7 bg-[#1e1c1b] border-4 border-dashed border-stone-800 p-12 text-center rounded-none font-press text-[9px] text-stone-500 uppercase leading-relaxed">
              Open a tracked admissions quest from the side listings menu to manage checks.
            </div>
          )}

        </div>
      )}
    </div>
  );
}
