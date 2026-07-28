import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AdminRole =
  | "Owner"
  | "Admin"
  | "Manager"
  | "Inventory Manager"
  | "Order Manager"
  | "Customer Support"
  | "Marketing"
  | "Editor";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
};

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  Owner: ["*"],
  Admin: ["*"],
  Manager: ["products", "orders", "customers", "coupons", "inventory", "reviews", "analytics", "marketing", "shipping", "payments", "media", "seo"],
  "Inventory Manager": ["products", "inventory", "media"],
  "Order Manager": ["orders", "customers", "shipping", "payments"],
  "Customer Support": ["orders", "customers", "reviews"],
  Marketing: ["coupons", "analytics", "marketing", "media", "seo"],
  Editor: ["products", "categories", "media", "seo"],
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  lockoutRemainingSeconds: number;
  failedAttempts: number;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
const ADMIN_TOKEN_KEY = "peher-admin-token";
const ADMIN_USER_KEY = "peher-admin-user";
const LOCKOUT_KEY = "peher-admin-lockout";
const FAILED_ATTEMPTS_KEY = "peher-admin-failed-attempts";

const DEFAULT_ADMIN: AdminUser = {
  id: "adm-001",
  name: "Vasudha Tiwari",
  email: "admin@peher.studio",
  role: "Owner",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  lastLogin: new Date().toISOString(),
  twoFactorEnabled: true,
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState(0);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY) || sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const savedUser = localStorage.getItem(ADMIN_USER_KEY) || sessionStorage.getItem(ADMIN_USER_KEY);
      const savedLockout = localStorage.getItem(LOCKOUT_KEY);
      const savedFailed = localStorage.getItem(FAILED_ATTEMPTS_KEY);

      if (savedLockout) {
        const until = parseInt(savedLockout, 10);
        if (until > Date.now()) {
          setLockoutUntil(until);
        } else {
          localStorage.removeItem(LOCKOUT_KEY);
        }
      }

      if (savedFailed) {
        setFailedAttempts(parseInt(savedFailed, 10));
      }

      if (savedToken && savedUser) {
        setToken(savedToken);
        setAdminUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemainingSeconds(remaining);
      if (remaining === 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutUntil]);

  useEffect(() => {
    if (!adminUser) return;

    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, 30 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, [adminUser]);

  const login = async (email: string, pass: string, remember: boolean): Promise<boolean> => {
    if (lockoutUntil && Date.now() < lockoutUntil) {
      throw new Error(`Account locked due to multiple failed attempts. Try again in ${lockoutRemainingSeconds} seconds.`);
    }

    if (email.toLowerCase() === "admin@peher.studio" && pass === "admin123") {
      const mockToken = `peher_jwt_admin_${Date.now()}`;
      const loggedUser = { ...DEFAULT_ADMIN, lastLogin: new Date().toISOString() };

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(ADMIN_TOKEN_KEY, mockToken);
      storage.setItem(ADMIN_USER_KEY, JSON.stringify(loggedUser));

      setToken(mockToken);
      setAdminUser(loggedUser);
      setFailedAttempts(0);
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      return true;
    } else {
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      localStorage.setItem(FAILED_ATTEMPTS_KEY, nextFailed.toString());

      if (nextFailed >= 5) {
        const until = Date.now() + 15 * 60 * 1000;
        setLockoutUntil(until);
        localStorage.setItem(LOCKOUT_KEY, until.toString());
        throw new Error("Too many failed attempts. Account temporarily locked for 15 minutes.");
      }

      throw new Error(`Invalid credentials. ${5 - nextFailed} attempt(s) remaining before lockout.`);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    setToken(null);
    setAdminUser(null);
  };

  const hasPermission = (permission: string) => {
    if (!adminUser) return false;
    const permissions = ROLE_PERMISSIONS[adminUser.role] || [];
    return permissions.includes("*") || permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        loading,
        login,
        logout,
        hasPermission,
        lockoutRemainingSeconds,
        failedAttempts,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
