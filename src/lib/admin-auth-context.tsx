import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { setAuthPersistence, supabase } from "@/lib/supabase";
import { serverApi } from "@/lib/server-api";

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
  permissions: string[];
  avatar?: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
};

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  Owner: ["*"],
  Admin: ["*"],
  Manager: [
    "products",
    "orders",
    "customers",
    "coupons",
    "inventory",
    "reviews",
    "analytics",
    "marketing",
    "shipping",
    "payments",
    "taxes",
    "media",
    "seo",
    "settings",
    "categories",
  ],
  "Inventory Manager": ["products", "inventory", "media", "categories"],
  "Order Manager": ["orders", "customers", "shipping", "payments"],
  "Customer Support": ["orders", "customers", "reviews"],
  Marketing: ["coupons", "analytics", "marketing", "media", "seo"],
  Editor: ["products", "categories", "media", "seo"],
};

type AdminAuthContextType = {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  lockoutRemainingSeconds: number;
  failedAttempts: number;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

type AdminResolutionError = Error & {
  status?: number;
};

function isTerminalAdminAuthError(error: unknown) {
  const status = (error as AdminResolutionError | undefined)?.status;
  return status === 401 || status === 403;
}

async function resolveAdmin(session: Session | null): Promise<AdminUser | null> {
  if (!session) return null;
  const data = await serverApi<{
    membership: {
      display_name: string;
      email: string;
      role: AdminRole;
      permissions: string[] | null;
      two_factor_enabled: boolean;
    };
    profile: { avatar_path: string | null; last_login_at: string | null } | null;
  }>("/admin/session", { auth: true });
  const { membership, profile } = data;

  return {
    id: session.user.id,
    name: membership.display_name,
    email: membership.email,
    role: membership.role as AdminRole,
    permissions: membership.permissions ?? [],
    avatar: profile?.avatar_path ?? undefined,
    lastLogin: profile?.last_login_at ?? session.user.last_sign_in_at ?? new Date().toISOString(),
    twoFactorEnabled: membership.two_factor_enabled,
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        setAdminUser(await resolveAdmin(data.session));
      } catch (error) {
        if (isTerminalAdminAuthError(error)) {
          setAdminUser(null);
        } else {
          console.error("Admin session bootstrap failed", error);
        }
      } finally {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        if (!session) {
          setAdminUser(null);
          setLoading(false);
          return;
        }
        try {
          setAdminUser(await resolveAdmin(session));
        } catch (error) {
          if (isTerminalAdminAuthError(error)) {
            setAdminUser(null);
          } else {
            console.error("Admin session refresh failed", error);
          }
        }
        setLoading(false);
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, remember: boolean) => {
    setAuthPersistence(remember);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error("Email or password is incorrect, or sign-in is temporarily unavailable.");
    }
    const resolved = await resolveAdmin(data.session);
    if (!resolved) {
      await supabase.auth.signOut();
      throw new Error("This account does not have access to the admin console.");
    }
    setAdminUser(resolved);
    try {
      await serverApi("/admin/session/touch", { method: "POST", auth: true });
    } catch (error) {
      console.error("Admin session touch failed", error);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Password recovery could not be started. Please try again later.");
    setAdminUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    });
    if (error) throw error;
  };

  const hasPermission = (permission: string) => {
    if (!adminUser) return false;
    const permissions = adminUser.permissions.length
      ? adminUser.permissions
      : ROLE_PERMISSIONS[adminUser.role];
    return permissions.includes("*") || permissions.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        login,
        logout,
        requestPasswordReset,
        hasPermission,
        lockoutRemainingSeconds: 0,
        failedAttempts: 0,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
}
