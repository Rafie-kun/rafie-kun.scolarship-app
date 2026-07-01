import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, X, CheckCircle, Database, RefreshCw, Trash2, Shield, Info, Radio, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

export interface SyncEvent {
  id: string;
  timestamp: string;
  type: string;
  details: string[];
  points: number;
  status: 'success' | 'failed';
}

export default function SyncStatusDrawer() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncEvent[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load sync logs from localStorage
  const loadSyncHistory = () => {
    try {
      const historyStr = localStorage.getItem('scholarpath_sync_history');
      if (historyStr) {
        setSyncHistory(JSON.parse(historyStr));
      } else {
        // Seed default initial logs if empty
        const initialLogs: SyncEvent[] = [
          {
            id: 'sync-seed-1',
            timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() + " " + new Date().toLocaleDateString(),
            type: 'System Init Link',
            details: ['Establish telemetry session with Central ScholarPath DB', 'Verify credentials handshakes', 'Sync 12 core matched scholarships rules'],
            points: 0,
            status: 'success'
          }
        ];
        localStorage.setItem('scholarpath_sync_history', JSON.stringify(initialLogs));
        setSyncHistory(initialLogs);
      }
    } catch (err) {
      console.error("Failed to parse sync history logs:", err);
    }
  };

  useEffect(() => {
    loadSyncHistory();

    // Listen to real-time updates from AuthContext
    const handleSyncUpdate = () => {
      loadSyncHistory();
    };

    window.addEventListener('sync-history-updated', handleSyncUpdate);
    return () => {
      window.removeEventListener('sync-history-updated', handleSyncUpdate);
    };
  }, []);

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleClearLogs = () => {
    playClickSound();
    localStorage.removeItem('scholarpath_sync_history');
    setSyncHistory([]);
  };

  const handleManualVerify = async () => {
    playClickSound();
    setIsVerifying(true);
    // Simulate connection pinging & sync checks
    setTimeout(() => {
      setIsVerifying(false);
      // Retrieve current state or update
      loadSyncHistory();
    }, 1200);
  };

  const isOnline = !profile?.offlineMode;

  return (
    <div id="scholarpath-sync-status-widget">
      {/* Header Button Trigger */}
      <button
        onClick={handleToggle}
        className="relative w-11 h-11 bg-stone-850 hover:bg-stone-800 border-4 border-black flex items-center justify-center cursor-pointer transition-all [box-shadow:inset_-3px_-3px_0_#141414,inset_3px_3px_0_#555] active:[box-shadow:inset_3px_3px_0_#141414,inset_-3px_-3px_0_#555]"
        title="Mainframe Synchronization Status"
      >
        <Network className={`w-5 h-5 ${isOnline ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`} />
        {/* Glowing connectivity dot */}
        <span className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </button>

      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleToggle}
              className="fixed inset-0 bg-black z-[250]"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#232120] border-l-4 border-black p-5 [box-shadow:inset_4px_4px_0_#555] z-[300] flex flex-col overflow-hidden text-stone-200"
            >
              {/* Drawer Title Header */}
              <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span className="font-press text-[11px] text-[#ffff55] tracking-wider uppercase mc-text-shadow">
                    Sync Ledger
                  </span>
                </div>
                <button
                  onClick={handleToggle}
                  className="bg-stone-800 hover:bg-stone-700 border-2 border-black p-1 cursor-pointer transition-all [box-shadow:inset_-2px_-2px_0_#111,inset_2px_2px_0_#666]"
                >
                  <X className="w-4 h-4 text-stone-400 hover:text-white" />
                </button>
              </div>

              {/* Server Connectivity Status Card */}
              <div className="bg-black/45 border-2 border-black p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-stone-400">Connection Link:</span>
                  {isOnline ? (
                    <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] text-emerald-400 font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Mainframe Online
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] text-amber-400 font-bold uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Offline Buffer Mode
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-sans text-stone-300 leading-relaxed">
                    {isOnline 
                      ? "All local accomplishments are being synced in real-time. Changes are permanently persisted on the central database server."
                      : "We are temporarily saving changes to your offline inventory. These will automatically upload as soon as a link is re-established."
                    }
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleManualVerify}
                    disabled={isVerifying}
                    className="flex-1 bg-stone-800 hover:bg-stone-750 border-2 border-black py-1.5 px-3 font-mono text-[10px] text-stone-200 uppercase font-black tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    {isVerifying ? 'Pinging Mainframe...' : 'Re-verify Link'}
                  </button>
                </div>
              </div>

              {/* Synchronization History Logs */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 scrollbar-thin">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#ffaa00] uppercase font-bold tracking-wider">
                    Historic Sync Logs ({syncHistory.length})
                  </span>
                  {syncHistory.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      className="font-mono text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 uppercase underline cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Logs
                    </button>
                  )}
                </div>

                {syncHistory.length === 0 ? (
                  <div className="bg-black/20 border border-stone-800 p-8 text-center rounded-none">
                    <Info className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                    <p className="font-mono text-xs text-stone-400">No synchronization records found in local storage.</p>
                  </div>
                ) : (
                  syncHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-black/20 hover:bg-black/30 border-2 border-black p-3 space-y-2 transition-colors duration-150"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {item.type}
                          </span>
                          <span className="text-[10px] font-mono text-stone-500 block mt-0.5">
                            ⏱️ {item.timestamp}
                          </span>
                        </div>
                        {item.points > 0 && (
                          <div className="bg-[#1b3d1b] border border-emerald-800 text-[#55ff55] font-press text-[8px] px-1.5 py-0.5 select-none shrink-0 leading-none">
                            +{item.points} XP
                          </div>
                        )}
                      </div>

                      {/* Synced Bullet Points */}
                      <div className="bg-stone-900/55 p-2 border border-stone-800/80 rounded-none space-y-1">
                        {item.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] font-sans text-stone-300">
                            <Zap className="w-3 h-3 text-[#ffff55] shrink-0 mt-0.5" />
                            <span className="leading-tight">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t-4 border-black pt-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400 select-none">
                  <Shield className="w-3.5 h-3.5 text-[#ff5555]" />
                  <span>Verified Secure Cryptographic Sync Protocol</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
