import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../services/auth.service";
import { getSettings } from "../services/setting.service";
import AppConfig from "../appConfig";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const LAST_ACTIVITY_KEY = "last_activity";
const INACTIVITY_TIMEOUT = 120 * 60 * 1000; // 120 minutes in milliseconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const resetTimer = useCallback(() => {
    const timeoutId = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    return () => clearTimeout(timeoutId);
  }, [logout]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    if (storedToken && storedUser) {
      const now = Date.now();
      const lastActivity = storedLastActivity
        ? parseInt(storedLastActivity)
        : now;
      if (now - lastActivity > INACTIVITY_TIMEOUT) {
        logout();
      } else {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        resetTimer();

        // Load settings and set on window only if authenticated
        if (storedToken) {
          getSettings()
            .then((settings: any) => {
              (window as any).appSettings = settings;

              // Update favicon dynamically
              const faviconSetting = settings["setting.app_favicon"];
              if (faviconSetting) {
                const apiBase = AppConfig.API_URL.replace(/\/$/, "");
                const faviconUrl = `${apiBase}/${faviconSetting}`;
                const faviconLink = document.querySelector(
                  'link[rel="icon"]',
                ) as HTMLLinkElement;
                if (faviconLink) {
                  faviconLink.href = faviconUrl;
                }
              }
            })
            .catch((error: any) => {
              console.error("Failed to load settings:", error);
            });
        }
      }
    }
  }, [logout, resetTimer]);

  useEffect(() => {
    let timeoutId: number | null = null;

    const handleActivity = () => {
      if (token && user) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
        }, INACTIVITY_TIMEOUT);
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    setToken(newToken);
    setUser(newUser);
    resetTimer();

    // Load settings and set on window
    getSettings()
      .then((settings: any) => {
        (window as any).appSettings = settings;

        // Update favicon dynamically
        const faviconSetting = settings["setting.app_favicon"];
        if (faviconSetting) {
          const apiBase = AppConfig.API_URL.replace(/\/$/, "");
          const faviconUrl = `${apiBase}/${faviconSetting}`;
          const faviconLink = document.querySelector(
            'link[rel="icon"]',
          ) as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = faviconUrl;
          }
        }
      })
      .catch((error: any) => {
        console.error("Failed to load settings:", error);
      });
  };

  const updateUser = (newUser: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      // You can implement an API call to refresh user data if needed
      // For now, we'll just ensure the user data is up to date
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 0) return true; // Super admin has all permissions

    if (!user.permission) return false;
    const userPermissions = user.permission.split(",").map((p) => p.trim());
    const hasPerm = userPermissions.includes(permission);

    return hasPerm;
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!token && !!user,
    hasPermission,
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
