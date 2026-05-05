"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  updateTfaStatus: (enabled: boolean) => void;
  tfaEnabled: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const LAST_CLOSE_TIME_KEY = "last_close_time";
const TFA_ENABLED_KEY = "tfa_enabled";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tfaEnabled, setTfaEnabled] = useState<boolean>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.removeItem(LAST_CLOSE_TIME_KEY); // Reset timer on login
    setToken(newToken);
    setUser(newUser);
    setTfaEnabled(newUser.status_tfa || false);
    localStorage.setItem(
      TFA_ENABLED_KEY,
      (newUser.status_tfa || false).toString(),
    );
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_CLOSE_TIME_KEY);
    localStorage.removeItem(TFA_ENABLED_KEY);
    setToken(null);
    setUser(null);
    setTfaEnabled(false);
  };

  const updateUser = useCallback((newUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setTfaEnabled(newUser.status_tfa || false);
  }, []);

  const updateTfaStatus = useCallback((enabled: boolean) => {
    setTfaEnabled(enabled);
    localStorage.setItem(TFA_ENABLED_KEY, enabled.toString());
  }, []);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(
      () => {
        console.log("Auto-logout due to inactivity");
        logout();
        window.location.href = "/auth/login";
      },
      120 * 60 * 1000,
    ); // 120 minutes
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedTfaEnabled = localStorage.getItem(TFA_ENABLED_KEY);
    const lastCloseTime = localStorage.getItem(LAST_CLOSE_TIME_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setTfaEnabled(parsedUser.status_tfa || false);
      } catch (err) {
        console.error("Invalid user data in localStorage, clearing it", err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    if (storedTfaEnabled) {
      setTfaEnabled(storedTfaEnabled === "true");
    }

    // Check for auto-logout if more than 2 minutes since last close
    if (lastCloseTime) {
      const timeDiff = Date.now() - parseInt(lastCloseTime, 10);
      if (timeDiff > 120 * 60 * 1000) {
        // 120 minutes in milliseconds
        logout();
      }
    }

    setLoading(false);

    // Server status check removed to prevent 404 errors
    // The /status endpoint doesn't exist on the server
  }, []);

  // Listen for server-crash event and logout
  useEffect(() => {
    const handleServerCrash = () => {
      console.log("Server crash detected, logging out");
      logout();
      window.location.href = "/auth/login";
    };

    window.addEventListener("server-crash", handleServerCrash);

    return () => {
      window.removeEventListener("server-crash", handleServerCrash);
    };
  }, []);

  // Set timestamp on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(LAST_CLOSE_TIME_KEY, Date.now().toString());
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Inactivity timer and event listeners
  useEffect(() => {
    if (token && user) {
      resetInactivityTimer();

      const handleActivity = () => resetInactivityTimer();

      // Add event listeners for user activity
      window.addEventListener("mousedown", handleActivity);
      window.addEventListener("mousemove", handleActivity);
      window.addEventListener("keypress", handleActivity);
      window.addEventListener("scroll", handleActivity);
      window.addEventListener("touchstart", handleActivity);

      return () => {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
        window.removeEventListener("mousedown", handleActivity);
        window.removeEventListener("mousemove", handleActivity);
        window.removeEventListener("keypress", handleActivity);
        window.removeEventListener("scroll", handleActivity);
        window.removeEventListener("touchstart", handleActivity);
      };
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [token, user]);

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    updateTfaStatus,
    tfaEnabled,
    isAuthenticated: !!token && !!user,
    loading,
    isLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
