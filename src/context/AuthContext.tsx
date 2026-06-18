import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { playClickSound, playAdvancementSound, playXpSound } from '../utils/sound';

interface AuthContextType {
  token: string | null; // Keep for type backward compatibility (always null/secure)
  user: string | null;
  profile: Profile | null;
  isLoggedIn: boolean;
  isGuest: boolean;
  authLoading: boolean;
  authError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, fullName: string, gpa: string, major: string) => Promise<boolean>;
  guestLogin: () => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  rewardPoints: (points: number, actionName: string, badgeToUnlock?: string) => Promise<void>;
  authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Synced wrapper around standard fetch to automatically supply credentials and cookies
  const authorizedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    } as Record<string, string>;

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Critical to pass httpOnly cookies across local routing nodes
    });
  };

  const refreshProfile = async () => {
    try {
      const res = await authorizedFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        
        // Dispatch event for components listening on native window
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: data }));
      }
    } catch (e) {
      console.error("Failed to sync profile card:", e);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
          setProfile(data.profile);
          setIsGuest(!!data.isGuest);
          setIsLoggedIn(true);
        } else {
          // No session or guest spawned yet, keep logged out
          setIsLoggedIn(false);
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        console.warn("Cookies check failed on initialization", e);
      } finally {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    playClickSound();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Authentication failed");
      }

      const data = await res.json();
      setUser(data.username);
      setProfile(data.profile);
      setIsGuest(false);
      setIsLoggedIn(true);
      playAdvancementSound();
      return true;
    } catch (e: any) {
      setAuthError(e.message || "Invalid signature details.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (username: string, password: string, fullName: string, gpa: string, major: string): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    playClickSound();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          fullName,
          gpa,
          intendedMajor: major
        }),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Register failed");
      }

      const data = await res.json();
      setUser(data.username);
      setProfile(data.profile);
      setIsGuest(false);
      setIsLoggedIn(true);
      playAdvancementSound();
      return true;
    } catch (e: any) {
      setAuthError(e.message || "Registration failed.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const guestLogin = async (): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    playClickSound();

    try {
      const res = await fetch('/api/auth/guest', { 
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error("Fallback failed");

      const data = await res.json();
      setUser(data.username);
      setProfile(data.profile);
      setIsGuest(true);
      setIsLoggedIn(true);
      playAdvancementSound();
      return true;
    } catch (e) {
      console.error("Local Guest spawn failed:", e);
      setAuthError("Failed to spawn Guest session due to communications anomaly.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    playClickSound();
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn("Logout request failed, clearing states locally", e);
    }
    setUser(null);
    setProfile(null);
    setIsGuest(false);
    setIsLoggedIn(false);
  };

  const rewardingRef = React.useRef<boolean>(false);
  const rewardedActionsRef = React.useRef<Set<string>>(new Set());

  const rewardPoints = async (points: number, actionName: string, badgeToUnlock?: string) => {
    if (rewardingRef.current) return;
    if (rewardedActionsRef.current.has(actionName)) {
      console.log(`Action "${actionName}" was already rewarded in this session.`);
      return;
    }

    rewardingRef.current = true;
    rewardedActionsRef.current.add(actionName);

    try {
      const res = await authorizedFetch('/api/profile/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, actionName, badgeToUnlock })
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
        playXpSound();
      } else {
        rewardedActionsRef.current.delete(actionName);
      }
    } catch (err) {
      console.error("Reward communication failure:", err);
      rewardedActionsRef.current.delete(actionName);
    } finally {
      rewardingRef.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{
      token: null, // Zero localStorage token leak
      user,
      profile,
      isLoggedIn,
      isGuest,
      authLoading,
      authError,
      login,
      register,
      guestLogin,
      logout,
      refreshProfile,
      rewardPoints,
      authorizedFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
