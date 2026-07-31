import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { AuthProvider } from "../lib/auth-context";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getStorefrontSettings } from "../lib/catalog-api";
import {
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  serializeJsonLd,
} from "../lib/seo";
import { ADMIN_ROUTE_PATH } from "../lib/admin-paths";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page did not load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getStorefrontSettings(),
  head: ({ loaderData: settings, matches }) => {
    if (!settings) {
      return {
        meta: [
          { charSet: "utf-8" },
          { name: "viewport", content: "width=device-width, initial-scale=1" },
          { title: "PEHER | Handcrafted Jewellery" },
          {
            name: "description",
            content: "Discover handcrafted PEHER jewellery, made in India.",
          },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
      };
    }
    const pathname = matches.at(-1)?.pathname ?? "/";
    const isPrivateRoute =
      pathname === ADMIN_ROUTE_PATH ||
      pathname.startsWith(`${ADMIN_ROUTE_PATH}/`) ||
      /^\/(dashboard|checkout|cart|wishlist|login|signup)(\/|$)/.test(pathname);
    const canonical = absoluteUrl(settings, pathname === "/" ? "" : pathname);
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: settings.metaTitle },
        { name: "description", content: settings.metaDescription },
        { name: "author", content: "PEHER" },
        {
          name: "robots",
          content: isPrivateRoute ? "noindex,nofollow" : "index,follow,max-image-preview:large",
        },
        { property: "og:title", content: settings.metaTitle },
        { property: "og:description", content: settings.metaDescription },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: settings.storeName },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "theme-color", content: "#111111" },
      ],
      links: [
        ...(!isPrivateRoute ? [{ rel: "canonical", href: canonical }] : []),
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://checkout.razorpay.com" },
        { rel: "icon", href: "/peher-mark.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { rel: "shortcut icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "mask-icon", href: "/peher-mark.svg", color: "#111111" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildOrganizationJsonLd(settings)),
        },
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildWebsiteJsonLd(settings)),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const settings = Route.useLoaderData();
  const router = useRouter();
  const isAdminRoute =
    router.state.location.pathname === ADMIN_ROUTE_PATH ||
    router.state.location.pathname.startsWith(`${ADMIN_ROUTE_PATH}/`);
  const application = (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {settings?.maintenanceMode && !isAdminRoute ? (
            <main className="grid min-h-screen place-items-center bg-[#f4f1e9] px-6 text-center">
              <div className="max-w-lg">
                <img src="/peher-mark.svg" alt="Peher" className="mx-auto h-20 w-20 rounded-2xl" />
                <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
                  Atelier update in progress
                </p>
                <h1 className="mt-4 font-serif text-5xl text-neutral-900">
                  We will be back shortly.
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                  The Peher atelier is receiving a careful update. For urgent assistance, contact{" "}
                  {settings.contactEmail}.
                </p>
              </div>
            </main>
          ) : (
            <Outlet />
          )}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>{application}</QueryClientProvider>
  );
}
