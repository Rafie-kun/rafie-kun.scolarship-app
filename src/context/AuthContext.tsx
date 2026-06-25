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
  register: (username: string, password: string, fullName: string, gpa: string, major: string, extraFields?: any) => Promise<boolean>;
  guestLogin: () => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<boolean>;
  rewardPoints: (points: number, actionName: string, badgeToUnlock?: string) => Promise<void>;
  authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultProfile: Profile = {
  fullName: 'Guest Explorer',
  level: 1,
  points: 0,
  gpa: 3.0,
  maxGpa: 4.0,
  educationLevel: 'undergraduate',
  intendedDegree: 'undergraduate',
  intendedMajor: 'Computer Science',
  badges: [],
  leadershipExperience: [],
  projects: [],
  volunteerExperience: [],
  additionalSkills: [],
  hasCompletedOnboarding: false,
  offlineMode: true
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(defaultProfile);
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
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && JSON.stringify(customEvent.detail) !== JSON.stringify(profile)) {
        setProfile(customEvent.detail);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, [profile]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const localUserStr = localStorage.getItem('scholarpath_user');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          setUser(localUser.username);
          setProfile({ ...defaultProfile, ...localUser });
          setIsGuest(!!localUser.isGuest);
          setIsLoggedIn(true);
          setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
          setProfile({ ...defaultProfile, ...(data.profile || {}) });
          setIsGuest(!!data.isGuest);
          setIsLoggedIn(true);
        } else {
          // No session or guest spawned yet, keep logged out
          setIsLoggedIn(false);
          setUser(null);
          setProfile(defaultProfile);
        }
      } catch (e) {
        console.warn("Cookies check failed on initialization", e);
        setIsLoggedIn(true);
        setUser(defaultProfile.fullName);
        setProfile(defaultProfile);
        setIsGuest(true);
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
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          throw new Error(err.error || "Authentication failed");
        } else {
          throw new Error("Network or server error");
        }
      }

      const data = await res.json();
      
      const profileData = {
        ...data.profile,
        username: data.username,
        isGuest: false,
        offlineMode: false
      };
      localStorage.setItem('scholarpath_user', JSON.stringify(profileData));

      setUser(data.username);
      setProfile(profileData);
      setIsGuest(false);
      setIsLoggedIn(true);
      playAdvancementSound();
      return true;
    } catch (e: any) {
      if (e.message === "Authentication failed" || e.message === "Invalid credentials") {
        setAuthError(e.message || "Invalid signature details.");
        return false;
      }

      console.warn("API Login failed, falling back to local storage:", e);
      const fallbackProfile = { 
        ...defaultProfile,
        username, 
        fullName: username, 
        level: 1, 
        points: 0, 
        gpa: 3.0, 
        isGuest: false,
        offlineMode: true 
      };
      localStorage.setItem('scholarpath_user', JSON.stringify(fallbackProfile));
      setUser(username);
      setProfile(fallbackProfile as any);
      setIsGuest(false);
      setIsLoggedIn(true);
      
      playAdvancementSound();
      return true;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (
    username: string, 
    password: string, 
    fullName: string, 
    gpa: string, 
    major: string,
    extraFields?: any
  ): Promise<boolean> => {
    setAuthLoading(true);
    setAuthError(null);
    playClickSound();

    try {
      const payload = {
        username,
        password,
        fullName,
        gpa,
        intendedMajor: major,
        primaryMajor: major,
        ...extraFields
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Register failed");
      }

      const data = await res.json();
      
      const profileData = {
        ...data.profile,
        username: data.username,
        isGuest: false,
        offlineMode: false
      };
      localStorage.setItem('scholarpath_user', JSON.stringify(profileData));

      setUser(data.username);
      setProfile(profileData);
      setIsGuest(false);
      setIsLoggedIn(true);
      playAdvancementSound();
      return true;
    } catch (e: any) {
      console.warn("API Register failed, falling back to local storage:", e);
      const fallbackProfile = { 
        ...defaultProfile,
        username, 
        fullName, 
        level: 1, 
        points: 0, 
        gpa: parseFloat(gpa) || 3.0, 
        primaryMajor: major,
        isGuest: false,
        offlineMode: true 
      };
      localStorage.setItem('scholarpath_user', JSON.stringify(fallbackProfile));
      setUser(username);
      setProfile(fallbackProfile as any);
      setIsGuest(false);
      setIsLoggedIn(true);
      
      playAdvancementSound();
      return true;
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
      
      const profileData = {
        ...data.profile,
        username: data.username,
        isGuest: true,
        offlineMode: false
      };
      localStorage.setItem('scholarpath_user', JSON.stringify(profileData));

      setUser(data.username);
      setProfile(profileData);
      setIsGuest(true);
      setIsLoggedIn(true);
      
      playAdvancementSound();
      return true;
    } catch (e) {
      console.warn("API Guest spawn failed, falling back to local storage:", e);
      
      const fallbackGuestUser = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackGuestProfile = {
        ...defaultProfile,
        username: fallbackGuestUser,
        fullName: `Guest Explorer #${fallbackGuestUser.split('_')[1]}`,
        level: 1,
        points: 40,
        intendedMajor: "Information Technology",
        intendedDegree: "Master's Degree",
        country: "Canada",
        nationality: "Explorer Space",
        gpa: 3.50,
        maxGpa: 4.0,
        ieltsScore: "7.0",
        greScore: "310",
        leadershipExperience: ["Novice Camp Counselor"],
        projects: ["Procedural Map Builder"],
        volunteerExperience: ["Local Highschool Coding Club Support"],
        badges: ["Fresh Spawn"],
        educationLevel: "high_school",
        highSchoolName: "Explorer Secondary Academy",
        collegeName: "",
        primaryMajor: "Information Technology",
        secondaryMajor: "",
        minor: "",
        graduationYear: 2026,
        additionalSkills: ["Java", "HTML/CSS", "Python Basics"],
        resumePdf: "",
        rewardedActions: [],
        hasCompletedOnboarding: false,
        isGuest: true,
        offlineMode: true
      };

      localStorage.setItem('scholarpath_user', JSON.stringify(fallbackGuestProfile));
      setUser(fallbackGuestUser);
      setProfile(fallbackGuestProfile as any);
      setIsGuest(true);
      setIsLoggedIn(true);
      
      playAdvancementSound();
      return true;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    playClickSound();
    localStorage.removeItem('scholarpath_user');
    localStorage.removeItem('scholarpath_guest_profile'); // legacy cleanup
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn("Logout request failed, clearing states locally", e);
    }
    setUser(null);
    setProfile(defaultProfile);
    setIsGuest(false);
    setIsLoggedIn(false);
  };

  const updateProfile = async (updatedData: Partial<Profile>): Promise<boolean> => {
    try {
      const res = await authorizedFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const data = await res.json();
        
        // Always persist to local storage
        if (profile) {
          localStorage.setItem('scholarpath_user', JSON.stringify({
            ...profile,
            ...data
          }));
        }

        setProfile(data);
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: data }));
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to sync profile with server, updating locally:", e);
      if (profile) {
        const localUpdate = { ...profile, ...updatedData, offlineMode: true };
        localStorage.setItem('scholarpath_user', JSON.stringify(localUpdate));
        setProfile(localUpdate);
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: localUpdate }));
      }
      return true;
    }
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
      updateProfile,
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
