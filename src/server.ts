import "./lib/error-capture";

import { AsyncLocalStorage } from "node:async_hooks";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
let apiFetchPromise: Promise<(request: Request) => Promise<Response> | Response> | undefined;
const requestOriginStorage = new AsyncLocalStorage<string>();

type PeherGlobal = typeof globalThis & {
  __PEHER_GET_REQUEST_ORIGIN?: () => string;
};

(globalThis as PeherGlobal).__PEHER_GET_REQUEST_ORIGIN = () => requestOriginStorage.getStore() ?? "";

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function getApiFetch() {
  if (!apiFetchPromise) {
    apiFetchPromise = Promise.all([import("../backend/app.js"), import("srvx/node")]).then(
      ([appModule, srvxNode]) => srvxNode.toFetchHandler((appModule.default ?? appModule) as any),
    );
  }
  return apiFetchPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function withBrowserSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function renderApiError(error: unknown) {
  const message =
    error instanceof Error && error.message.includes("SUPABASE_")
      ? error.message
      : "The API server could not start. Check the Vercel function logs.";
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const pathname = requestUrl.pathname;
    return requestOriginStorage.run(origin, async () => {
      try {
        if (pathname === "/api" || pathname.startsWith("/api/")) {
          const apiFetch = await getApiFetch();
          return apiFetch(request);
        }
        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        return withBrowserSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
      } catch (error) {
        console.error(error);
        if (pathname === "/api" || pathname.startsWith("/api/")) {
          return renderApiError(error);
        }
        return withBrowserSecurityHeaders(
          new Response(renderErrorPage(), {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
        );
      }
    });
  },
};
