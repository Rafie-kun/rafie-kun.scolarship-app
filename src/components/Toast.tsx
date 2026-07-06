import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'info' | 'warning';
  message: string;
}

export function showToast(message: string, type: 'success' | 'info' | 'warning' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('scholarpath-toast', {
        detail: { message, type, id: Date.now().toString() }
      })
    );
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (customEvent.detail && customEvent.detail.message) {
        const newToast = customEvent.detail;
        setToasts((prev) => [...prev.slice(-3), newToast]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 3500);
      }
    };

    window.addEventListener('scholarpath-toast', handleToastEvent);
    return () => window.removeEventListener('scholarpath-toast', handleToastEvent);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto border-4 border-black p-3 font-mono text-xs flex items-start justify-between gap-2 shadow-2xl ${
              toast.type === 'warning'
                ? 'bg-amber-950 text-amber-200 border-amber-500'
                : toast.type === 'info'
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500'
                : 'bg-emerald-950 text-[#55ff55] border-[#55ff55]'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#55ff55]" />
              )}
              <span className="font-bold mc-text-shadow leading-tight">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-stone-100 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
