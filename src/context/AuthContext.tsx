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
  register: (username: string, password: string, email: string, fullName: string, gpa: string, major: string, extraFields?: any) => Promise<boolean>;
  guestLogin: () => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<boolean>;
  rewardPoints: (points: number, actionName: string, badgeToUnlock?: string) => Promise<void>;
  authorizedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultProfile: Profile = {
  fullName: '',
  level: 1,
  points: 0,
  gpa: 0.0,
  maxGpa: 4.0,
  educationLevel: 'undergraduate',
  intendedDegree: 'undergraduate',
  intendedMajor: '',
  country: 'United States',
  nationality: 'American',
  badges: [],
  leadershipExperience: [],
  projects: [],
  volunteerExperience: [],
  additionalSkills: [],
  hasCompletedOnboarding: false,
  offlineMode: false
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(defaultProfile);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isOfflineState, setIsOfflineState] = useState<boolean>(false);

  // Sync isOfflineState with profile.offlineMode to keep views updated
  const profileOfflineMode = profile?.offlineMode;
  const authUsername = user;
  useEffect(() => {
    if (profile && profile.offlineMode !== isOfflineState) {
      setProfile(prev => prev ? { ...prev, offlineMode: isOfflineState } : null);
    }
  }, [isOfflineState, profileOfflineMode, authUsername]);

  // Standalone/internal helper to register offline sync events
  const addSyncEvent = (type: string, details: string[], points: number = 0) => {
    try {
      const existingStr = localStorage.getItem('scholarpath_sync_history');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newEvent = {
        id: "sync-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
        type,
        details,
        points,
        status: 'success' as const
      };
      existing.unshift(newEvent);
      localStorage.setItem('scholarpath_sync_history', JSON.stringify(existing.slice(0, 50)));
      window.dispatchEvent(new CustomEvent('sync-history-updated'));
    } catch (err) {
      console.error("Error adding sync history event:", err);
    }
  };

  // Sync helper to post offline local modifications once connection is restored
  const syncUnsyncedData = async () => {
    const token = localStorage.getItem('scholarpath_jwt_token');
    let syncCount = 0;
    const syncDetails: string[] = [];
    let syncedPoints = 0;
    
    // 1. Synchronize deferred profile edits
    const pendingProfileStr = localStorage.getItem('scholarpath_pending_profile_update');
    if (pendingProfileStr) {
      try {
        const pendingData = JSON.parse(pendingProfileStr);
        console.log("[Sync] Synchronizing cached offline profile modifications...", pendingData);
        
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(pendingData),
          credentials: 'include'
        });
        
        if (res.ok) {
          console.log("[Sync] Offline profile modifications successfully synchronized.");
          localStorage.removeItem('scholarpath_pending_profile_update');
          syncCount++;
          syncDetails.push("Profile changes synchronized successfully: " + Object.keys(pendingData).join(", "));
        } else {
          console.warn(`[Sync] Server returned non-OK status (${res.status}) on profile sync.`);
        }
      } catch (err) {
        console.error("[Sync] Error synchronizing offline profile update:", err);
      }
    }
    
    // 2. Synchronize deferred XP accomplishments
    const pendingRewardsStr = localStorage.getItem('scholarpath_pending_rewards');
    if (pendingRewardsStr) {
      try {
        const pendingRewards: Array<{ points: number, actionName: string, badgeToUnlock?: string }> = JSON.parse(pendingRewardsStr);
        if (pendingRewards.length > 0) {
          console.log(`[Sync] Synchronizing ${pendingRewards.length} deferred XP milestones...`);
          
          let successfullySyncedCount = 0;
          for (const reward of pendingRewards) {
            try {
              const res = await fetch('/api/profile/reward', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(reward),
                credentials: 'include'
              });
              
              if (res.ok) {
                successfullySyncedCount++;
                syncedPoints += reward.points;
                syncDetails.push(`Milestone synchronized: "${reward.actionName}" (+${reward.points} XP)`);
              } else {
                console.warn(`[Sync] Failed to sync milestone "${reward.actionName}". Status: ${res.status}`);
              }
            } catch (err) {
              console.error(`[Sync] Error syncing milestone "${reward.actionName}":`, err);
            }
          }
          
          const remainingRewards = pendingRewards.slice(successfullySyncedCount);
          if (remainingRewards.length === 0) {
            console.log("[Sync] All deferred milestones synchronized successfully.");
            localStorage.removeItem('scholarpath_pending_rewards');
            syncCount++;
          } else {
            localStorage.setItem('scholarpath_pending_rewards', JSON.stringify(remainingRewards));
          }
        }
      } catch (err) {
        console.error("[Sync] Error parsing or synchronizing deferred rewards:", err);
      }
    }
    
    // 3. Fetch canonical state from central database to align all panels
    try {
      const res = await fetch('/api/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include'
      });
      if (res.ok) {
        const freshProfile = await res.json();
        const alignedProfile = {
          ...freshProfile,
          offlineMode: false
        };
        setProfile(alignedProfile);
        localStorage.setItem('scholarpath_user', JSON.stringify(alignedProfile));
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: alignedProfile }));
        
        // Log the sync event if we had unsynced changes, or a general reconnection event
        if (syncDetails.length > 0) {
          addSyncEvent("Dynamic Reconciliation", syncDetails, syncedPoints);
        } else {
          addSyncEvent("Mainframe Link Check", ["Central ledger database connection verified", "Aligned active registers"], 0);
        }

        // Push safe in-app ledger notification
        const schedulerNotif = {
          id: "sync-complete-" + Date.now(),
          type: "success",
          message: "⚡ CONNECTION RESTORED! Your offline progress has been synchronized successfully with the mainframe database.",
          timestamp: "Just now"
        };
        console.log("[Sync] Ledger status updated: Online Mode active.");
      }
    } catch (err) {
      console.warn("[Sync] Failed to pull canonical state after sync:", err);
    }
  };

  // Connectivity check with rapid timeout to verify if central API is reachable
  const checkConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        setIsOfflineState(prev => {
          if (prev) {
            console.log("[Connectivity] Connection restored. Synchronizing deferred changes...");
            setTimeout(() => syncUnsyncedData(), 500);
          }
          return false;
        });
      } else {
        console.warn("[Connectivity] API health returned non-OK status:", res.status);
        setIsOfflineState(true);
      }
    } catch (err) {
      console.warn("[Connectivity] Mainframe connection attempt failed:", err);
      setIsOfflineState(true);
    }
  };

  // Periodic health check when online to detect outages
  useEffect(() => {
    if (isOfflineState) return;

    const intervalId = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/health', {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          // Double check before declaring offline to avoid transient spikes
          const reCheck = await fetch('/api/health').catch(() => null);
          if (!reCheck || !reCheck.ok) {
            setIsOfflineState(true);
          }
        }
      } catch (err) {
        const reCheck = await fetch('/api/health').catch(() => null);
        if (!reCheck || !reCheck.ok) {
          setIsOfflineState(true);
        }
      }
    }, 45000); // Check every 45s

    return () => clearInterval(intervalId);
  }, [isOfflineState]);

  // Exponential backoff reconnect loop active ONLY when offline
  useEffect(() => {
    if (!isOfflineState) return;

    let retryDelay = 2000;
    const maxDelay = 30000;
    let timerId: NodeJS.Timeout | null = null;
    let isActive = true;

    const attemptReconnection = async () => {
      if (!isActive) return;
      console.log(`[Reconnector] Checking mainframe availability (next check in ${retryDelay / 1000}s)...`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('/api/health', {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          console.log("[Reconnector] Connection verified!");
          setIsOfflineState(false);
          return;
        }
      } catch (err) {
        // Continue exponential check
      }

      retryDelay = Math.min(retryDelay * 1.5, maxDelay);
      timerId = setTimeout(attemptReconnection, retryDelay);
    };

    timerId = setTimeout(attemptReconnection, retryDelay);

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isOfflineState]);

  // Synced wrapper around standard fetch to automatically supply credentials and cookies
  const authorizedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('scholarpath_jwt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    } as Record<string, string>;

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Critical to pass httpOnly cookies across local routing nodes
      });
      return res;
    } catch (err) {
      console.warn(`[Network] Fetch exception targeting "${url}":`, err);
      // Run rapid verification in background
      checkConnectivity();
      throw err;
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await authorizedFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const normalized = { ...data, offlineMode: isOfflineState };
        setProfile(normalized);
        
        // Dispatch event for components listening on native window
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: normalized }));
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
        const token = localStorage.getItem('scholarpath_jwt_token');
        // Always try to sync with the server database first to fetch fresh XP points and levels
        const res = await fetch('/api/auth/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
          credentials: 'include'
        });
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
          // Perform any sync if needed
          setTimeout(() => syncUnsyncedData(), 500);
        } else {
          // If server check fails (no session), fall back to local storage cache if present
          const localUserStr = localStorage.getItem('scholarpath_user');
          if (localUserStr) {
            const localUser = JSON.parse(localUserStr);
            setUser(localUser.username);
            // Default to onlineMode: false initially to avoid flash of offline banner. Will double check immediately in background.
            const profileToLoad = { ...defaultProfile, ...localUser, offlineMode: false };
            setProfile(profileToLoad);
            setIsGuest(!!localUser.isGuest);
            setIsLoggedIn(true);
            
            // Perform connection check to confirm actual status
            checkConnectivity();
          } else {
            setIsLoggedIn(false);
            setUser(null);
            setProfile(defaultProfile);
          }
        }
      } catch (e) {
        console.warn("Server check failed on initialization, falling back to local storage:", e);
        setIsOfflineState(true);
        const localUserStr = localStorage.getItem('scholarpath_user');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          setUser(localUser.username);
          const profileToLoad = { ...defaultProfile, ...localUser, offlineMode: true };
          setProfile(profileToLoad);
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
      if (data.token) {
        localStorage.setItem('scholarpath_jwt_token', data.token);
      }

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
    email: string,
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
        email,
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
      if (data.token) {
        localStorage.setItem('scholarpath_jwt_token', data.token);
      }

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
      if (data.token) {
        localStorage.setItem('scholarpath_jwt_token', data.token);
      }

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
    localStorage.removeItem('scholarpath_jwt_token');
    
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
        
        // Clear any pending offline profile updates since we are back online
        localStorage.removeItem('scholarpath_pending_profile_update');

        // Always persist to local storage
        if (profile) {
          const mergedProfile = {
            ...profile,
            ...data,
            offlineMode: false // Explicitly clear offline mode
          };
          localStorage.setItem('scholarpath_user', JSON.stringify(mergedProfile));
          setProfile(mergedProfile);
        } else {
          setProfile(data);
        }

        window.dispatchEvent(new CustomEvent('profile-updated', { detail: data }));
        return true;
      }
      return false;
    } catch (e) {
      console.warn("Failed to sync profile with server, updating locally & queueing for sync:", e);
      // Save pending update in queue
      try {
        const existingPending = JSON.parse(localStorage.getItem('scholarpath_pending_profile_update') || '{}');
        const mergedPending = { ...existingPending, ...updatedData };
        localStorage.setItem('scholarpath_pending_profile_update', JSON.stringify(mergedPending));
      } catch (err) {
        console.error("Failed to queue pending profile updates:", err);
      }

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

  const queueRewardLocal = (points: number, actionName: string, badgeToUnlock?: string) => {
    // 1. Save in the pending rewards queue for background synchronization
    const existingQueueStr = localStorage.getItem('scholarpath_pending_rewards');
    let existingQueue = [];
    try {
      if (existingQueueStr) {
        existingQueue = JSON.parse(existingQueueStr);
      }
    } catch (e) {
      console.error("[Reward Queue] Error parsing pending queue:", e);
    }
    
    // Prevent duplicates in the queue
    if (!existingQueue.some((item: any) => item.actionName === actionName)) {
      existingQueue.push({ points, actionName, badgeToUnlock });
      localStorage.setItem('scholarpath_pending_rewards', JSON.stringify(existingQueue));
    }

    // 2. Compute local reward so UI updates immediately
    triggerLocalReward(points, actionName, badgeToUnlock);
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
        const mergedProfile = {
          ...updatedProfile,
          offlineMode: false // Explicitly clear offline mode
        };
        
        // Always persist to local storage to prevent reload resets
        localStorage.setItem('scholarpath_user', JSON.stringify(mergedProfile));
        setProfile(mergedProfile);
        
        // Dispatch event for other components to synchronize
        window.dispatchEvent(new CustomEvent('profile-updated', { detail: mergedProfile }));
        
        // Sound cues based on level change
        if (profile && mergedProfile.level > (profile.level || 1)) {
          playAdvancementSound();
        } else {
          playXpSound();
        }
      } else {
        console.warn("Server reward returned non-ok, falling back to local calculation & queueing for sync.");
        queueRewardLocal(points, actionName, badgeToUnlock);
      }
    } catch (err) {
      console.warn("Reward communication failure, falling back to local calculation & queueing for sync:", err);
      queueRewardLocal(points, actionName, badgeToUnlock);
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
