import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Download, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';

type TrackedApp = {
  id: string;
  name: string;
  providerOrUni?: string;
  deadline?: string;
  status?: string;
};

function formatIcsDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function buildIcs(apps: TrackedApp[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScholarPath//Deadline Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const app of apps) {
    if (!app.deadline) continue;
    const dt = formatIcsDate(app.deadline);
    if (!dt) continue;
    // one day before deadline at 09:00 UTC as reminder
    const d = new Date(app.deadline);
    d.setDate(d.getDate() - 1);
    d.setUTCHours(9, 0, 0, 0);
    const remind = formatIcsDate(d.toISOString());
    lines.push(
      'BEGIN:VEVENT',
      `UID:${app.id}@scholarpath.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${dt}`,
      `DTEND:${dt}`,
      `SUMMARY:${(app.name || 'Scholarship').replace(/[,;]/g, ' ')} - Deadline`,
      `DESCRIPTION:Provider: ${(app.providerOrUni || '').replace(/[,;]/g, ' ')} | Status: ${app.status || 'Tracked'}`,
      `BEGIN:VALARM`,
      `TRIGGER:-P1D`,
      `ACTION:DISPLAY`,
      `DESCRIPTION:Reminder: ${(app.name || '').replace(/[,;]/g, ' ')} deadline tomorrow`,
      `END:VALARM`,
      'END:VEVENT'
    );
    // also add reminder one week before if deadline > 14 days away
    if (remind && d.getTime() < new Date(app.deadline).getTime() - 6*24*3600*1000) {
      // we already set 1 day reminder via VALARM, the 1-week is extra event for visibility
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function DeadlineCalendar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { authorizedFetch } = useAuth();
  const [apps, setApps] = useState<TrackedApp[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchApps = async () => {
      setLoading(true);
      try {
        const res = await authorizedFetch('/api/applications');
        if (res.ok) {
          const data = await res.json();
          const list: TrackedApp[] = Array.isArray(data) ? data : data.applications || [];
          setApps(list.filter(a => a.deadline));
        }
      } catch {}
      setLoading(false);
    };
    fetchApps();
  }, [open, authorizedFetch]);

  const handleExportIcs = () => {
    playClickSound();
    const ics = buildIcs(apps);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scholarpath-deadlines.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGoogleCalendar = (app: TrackedApp) => {
    if (!app.deadline) return;
    const start = new Date(app.deadline);
    const end = new Date(start); end.setHours(end.getHours() + 1);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(app.name + ' Deadline')}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent((app.providerOrUni || '') + ' - Tracked via ScholarPath')}&ctz=UTC`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-auto bg-[#1a1817] border-4 border-black p-5 space-y-4 [box-shadow:inset_-4px_-4px_0_#111,inset_4px_4px_0_#555]">
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <h3 className="font-press text-[11px] text-[#55ff55] flex items-center gap-2">
            <CalIcon className="w-5 h-5" /> DEADLINE CALENDAR
          </h3>
          <button onClick={onClose} className="w-8 h-8 bg-stone-800 border-2 border-black flex items-center justify-center hover:bg-stone-700">
            <X className="w-4 h-4 text-stone-300" />
          </button>
        </div>

        <p className="text-xs font-mono text-stone-400">
          Your tracked scholarships and their deadlines. Export once and import into Google Calendar, Apple Calendar or Outlook.
        </p>

        {loading ? (
          <div className="py-10 text-center font-press text-[10px] text-[#ffff55]">LOADING...</div>
        ) : apps.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="font-mono text-sm text-stone-400">No tracked deadlines yet.</p>
            <p className="font-mono text-xs text-stone-500">Track a scholarship from the finder to see it here.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleExportIcs} className="mc-btn px-4 py-2 text-[9px] flex items-center gap-2">
                <Download className="w-4 h-4" /> Download .ICS (all deadlines)
              </button>
              <span className="text-[10px] font-mono text-stone-500 self-center">Import this file into Google Calendar via Settings → Import & Export.</span>
            </div>

            <div className="space-y-2">
              {apps
                .slice()
                .sort((a, b) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())
                .map(app => {
                  const d = new Date(app.deadline || '');
                  const isPast = d.getTime() < Date.now();
                  const isSoon = !isPast && d.getTime() - Date.now() < 14 * 24 * 3600 * 1000;
                  return (
                    <div key={app.id} className={`p-3 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isPast ? 'bg-red-950/30 border-red-900 opacity-60' : isSoon ? 'bg-amber-950/30 border-amber-700' : 'bg-stone-900 border-stone-800'}`}>
                      <div className="space-y-0.5">
                        <span className="font-bold text-stone-100 text-xs block">{app.name}</span>
                        {app.providerOrUni && <span className="text-[10px] font-mono text-stone-400">{app.providerOrUni}</span>}
                        <span className={`text-[10px] font-mono flex items-center gap-1 ${isPast ? 'text-red-300' : isSoon ? 'text-[#ffaa00]' : 'text-stone-400'}`}>
                          <Clock className="w-3 h-3" /> {app.deadline} {isPast ? '· Passed' : isSoon ? '· Due soon!' : ''}
                          {app.status && <span className="ml-2 px-1.5 py-0.5 bg-black/40 border border-stone-700 text-[9px]">{app.status}</span>}
                        </span>
                      </div>
                      <button onClick={() => handleGoogleCalendar(app)} className="mc-btn px-3 py-2 text-[8px] shrink-0 flex items-center gap-1.5">
                        <CalIcon className="w-3.5 h-3.5" /> Add to Google Calendar
                      </button>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
