import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

const AUTH_PERSISTENCE_KEY = "peher-auth-persistence";

function shouldPersistAuth() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTH_PERSISTENCE_KEY) !== "session";
}

const authStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    const persistent = shouldPersistAuth();
    const primary = persistent ? window.localStorage : window.sessionStorage;
    const fallback = persistent ? window.sessionStorage : window.localStorage;
    return primary.getItem(key) ?? fallback.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    const persistent = shouldPersistAuth();
    const target = persistent ? window.localStorage : window.sessionStorage;
    const other = persistent ? window.sessionStorage : window.localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setAuthPersistence(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_PERSISTENCE_KEY, remember ? "local" : "session");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});

export const PRODUCT_MEDIA_BUCKET = "product-media";

export function getProductMediaUrl(path?: string | null) {
  if (!path) return "";
  return supabase.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
