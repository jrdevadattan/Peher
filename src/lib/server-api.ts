import { supabase } from "@/lib/supabase";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const response = await fetch(`${API_BASE}${path}`, {
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
