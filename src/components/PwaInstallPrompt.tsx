import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
      if (!localStorage.getItem('scholarpath_pwa_dismissed')) setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  const handleInstall = async () => {
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setVisible(false);
  };
  const handleDismiss = () => {
    localStorage.setItem('scholarpath_pwa_dismissed', '1');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-[#2c2c2c] border-4 border-black p-4 flex items-start justify-between gap-3 z-50 [box-shadow:0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="space-y-1">
        <span className="font-press text-[9px] text-[#ffff55] uppercase">Install ScholarPath</span>
        <p className="text-xs font-mono text-stone-300">Add to your home screen for offline access and deadline reminders.</p>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={handleInstall} className="mc-btn px-3 py-2 text-[9px] flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Install
        </button>
        <button onClick={handleDismiss} className="text-[10px] font-mono text-stone-500 hover:text-stone-300 flex items-center justify-center gap-1">
          <X className="w-3 h-3" /> Not now
        </button>
      </div>
    </div>
  );
}
