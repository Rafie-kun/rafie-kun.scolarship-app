import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

export function useBackgroundSync(intervalMs = 30000) {
  const { profile } = useAuth();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (profile) {
        try {
          const serialized = JSON.stringify(profile);
          if (serialized !== lastSavedRef.current) {
            localStorage.setItem('scholarpath_user', serialized);
            localStorage.setItem('scholarpath_guest_profile', serialized);
            lastSavedRef.current = serialized;
            showToast('✅ Profile state synchronized to local storage', 'success');
          }
        } catch (e) {
          console.warn('Background sync warning:', e);
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [profile, intervalMs]);
}
