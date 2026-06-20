import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sparkles, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';
import { AppNotification } from '../types';

/**
 * 🔔 NotificationsBell component displaying recent deadline alerts, XP gains, level promotions, etc.
 * Supports polling of latest alerts and an in-memory dismiss mechanism.
 */
export default function NotificationsBell() {
  const { authorizedFetch, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await authorizedFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (e) {
      console.warn("Failed to fetch notification ledger:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleClearNotifications = () => {
    playClickSound();
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-[#55ff55]" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-[#ffff55]" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#55ffff]" />;
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef} id="scholarpath-notifications-bell">
      <button
        onClick={handleToggle}
        className="relative w-11 h-11 bg-stone-850 hover:bg-stone-800 border-4 border-black flex items-center justify-center cursor-pointer transition-all [box-shadow:inset_-3px_-3px_0_#141414,inset_3px_3px_0_#555] active:[box-shadow:inset_3px_3px_0_#141414,inset_-3px_-3px_0_#555]"
        title="Scholar Ledger Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-[#ffff55] animate-swing" : "text-stone-300"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 border-2 border-black text-[#ffffff] px-1 py-0.5 text-[8px] font-press font-extrabold leading-none select-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Retro Chest Style Dropdown container */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-[#2c2927] border-4 border-black p-4 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555,0_10px_25px_rgba(0,0,0,0.8)] z-[200] rounded-none">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
            <span className="font-press text-[9px] text-[#ffff55] uppercase flex items-center gap-1.5 mc-text-shadow">
              <Sparkles className="w-4 h-4 text-[#ffff55]" /> Alerts & Logs
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleClearNotifications}
                className="text-[9px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 uppercase underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Sweep All
              </button>
            )}
          </div>

          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-stone-400 font-mono text-xs select-none">
                No active notifications in your Quest Ledger.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="bg-black/30 border-2 border-black p-2.5 flex gap-2.5 items-start hover:bg-black/45 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-xs font-sans text-stone-200 leading-snug">
                      {notif.message}
                    </p>
                    <span className="text-[9px] font-mono text-stone-500 block">
                      ⏱️ {notif.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
