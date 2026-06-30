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
  country: 'United States',
  nationality: 'American',
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
      if (customEvent.detail) {
        setProfile(customEvent.detail);
        localStorage.setItem('scholarpath_user', JSON.stringify(customEvent.detail));
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('profile-updated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Always try to sync with the server database first to fetch fresh XP points and levels
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
          const freshProfile = { 
            ...defaultProfile, 
            ...(data.profile || {}),
            username: data.username,
            isGuest: !!data.isGuest,
            offlineMode: false 
          };
          setProfile(freshProfile);
          setIsGuest(!!data.isGuest);
          setIsLoggedIn(true);
          localStorage.setItem('scholarpath_user', JSON.stringify(freshProfile));
        } else {
          // If server check fails (no session), fall back to local storage cache if present
          const localUserStr = localStorage.getItem('scholarpath_user');
          if (localUserStr) {
            const localUser = JSON.parse(localUserStr);
            setUser(localUser.username);
            setProfile({ ...defaultProfile, ...localUser });
            setIsGuest(!!localUser.isGuest);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
            setUser(null);
            setProfile(defaultProfile);
          }
        }
      } catch (e) {
        console.warn("Server check failed on initialization, falling back to local storage:", e);
        const localUserStr = localStorage.getItem('scholarpath_user');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          setUser(localUser.username);
          setProfile({ ...defaultProfile, ...localUser });
          setIsGuest(!!localUser.isGuest);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setProfile(defaultProfile);
        }
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
        points: 0,
        intendedMajor: "",
        intendedDegree: "",
        country: "",
        nationality: "",
        gpa: 4.0,
        maxGpa: 4.0,
        ieltsScore: "",
        greScore: "",
        leadershipExperience: [],
        projects: [],
        volunteerExperience: [],
        badges: [],
        educationLevel: "undergraduate",
        highSchoolName: "",
        collegeName: "",
        primaryMajor: "",
        secondaryMajor: "",
        minor: "",
        graduationYear: 2026,
        additionalSkills: [],
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
    
    // Clear user and guest-specific scoped caches on logout
    const u = user || 'guest';
    localStorage.removeItem(`scholarpath_mock_applications_${u}`);
    localStorage.removeItem(`scholarpath_copilot_chatHistory_v1_${u}`);
    localStorage.removeItem(`scholarpath_onboarding_completed_${u}`);
    
    localStorage.removeItem('scholarpath_user');
    localStorage.removeItem('scholarpath_guest_profile');
    localStorage.removeItem('scholarpath_show_welcome_wizard');
    
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

  // Helper for offline / local-only fallback
  const triggerLocalReward = (pts: number, actName: string, badge?: string) => {
    if (!profile) return;
    
    const currentRewarded = profile.rewardedActions || [];
    if (currentRewarded.includes(actName)) return;

    const updatedRewarded = [...currentRewarded, actName];
    const newPoints = (profile.points || 0) + pts;
    const newLevel = Math.floor(newPoints / 100) + 1;
    const isLevelUp = newLevel > (profile.level || 1);

    const updatedBadges = [...(profile.badges || [])];
    if (badge && !updatedBadges.includes(badge)) {
      updatedBadges.push(badge);
    }

    const updatedProfile: Profile = {
      ...profile,
      points: newPoints,
      level: newLevel,
      rewardedActions: updatedRewarded,
      badges: updatedBadges,
      offlineMode: true
    };

    localStorage.setItem('scholarpath_user', JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
    window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));

    if (isLevelUp) {
      playAdvancementSound();
    } else {
      playXpSound();
    }
  };

  const rewardPoints = async (points: number, actionName: string, badgeToUnlock?: string) => {
    if (rewardingRef.current) return;
    
    // Check session ref first
    if (rewardedActionsRef.current.has(actionName)) {
      console.log(`Action "${actionName}" was already rewarded in this session.`);
      return;
    }

    // Check active profile list of completed actions
    if (profile?.rewardedActions?.includes(actionName)) {
      console.log(`Action "${actionName}" was already rewarded in profile.`);
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
        
        // Always persist to local storage to prevent reload resets
        localStorage.setItem('scholarpath_user', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        
        // Dispatch event for other components to synchronize
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
        
        // Sound cues based on level change
        if (profile && updatedProfile.level > (profile.level || 1)) {
          playAdvancementSound();
        } else {
          playXpSound();
        }
      } else {
        console.warn("Server reward returned non-ok, falling back to local calculation.");
        triggerLocalReward(points, actionName, badgeToUnlock);
      }
    } catch (err) {
      console.warn("Reward communication failure, falling back to local calculation:", err);
      triggerLocalReward(points, actionName, badgeToUnlock);
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
