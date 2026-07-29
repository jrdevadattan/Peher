import { supabase } from "@/lib/supabase";

function normalizeApiBase(value: string) {
  return value.replace(/\/+$/, "");
}

function isLoopbackApiBase(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function getVercelOrigin() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!host) return "";
  return `https://${host.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
}

type PeherGlobal = typeof globalThis & {
  __PEHER_GET_REQUEST_ORIGIN?: () => string;
};

function getSsrRequestOrigin() {
  return (globalThis as PeherGlobal).__PEHER_GET_REQUEST_ORIGIN?.() ?? "";
}

export function getApiBase() {
  if (import.meta.env.VITE_API_URL) {
    const configuredApiBase = normalizeApiBase(import.meta.env.VITE_API_URL);
    if (import.meta.env.DEV || !isLoopbackApiBase(configuredApiBase)) {
      return configuredApiBase;
    }
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }
  if (typeof window === "undefined") {
    const requestOrigin = getSsrRequestOrigin();
    if (requestOrigin) return `${requestOrigin}/api`;
    const vercelOrigin = getVercelOrigin();
    return vercelOrigin ? `${vercelOrigin}/api` : "http://localhost:5000/api";
  }
  return "/api";
}

export const API_BASE = getApiBase();

export function apiUrl(path: string) {
  return `${getApiBase()}${path}`;
}

export async function serverApi<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers, ...requestOptions } = options;
  let accessToken: string | undefined;
  if (auth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    accessToken = session?.access_token;
    if (!accessToken) throw new Error("Your session has expired. Please sign in again.");
  }

  const isFormData = requestOptions.body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "The server could not process this request.");
  }
  return payload as T;
}
