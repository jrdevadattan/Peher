import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  deleteAdminSeoPage,
  getAdminSeoPages,
  getStoreSettings,
  saveAdminSeoPage,
  saveStoreSettings,
  submitAllUrlsToIndexNow,
  type AdminSeoPage,
  type StoreSettings,
} from "@/lib/admin-api";
import { Skeleton } from "@/components/ui/skeleton";

const emptySeoPage = (): AdminSeoPage => ({
  id: "",
  path: "",
  title: "",
  description: "",
  includeInSitemap: true,
  includeInLlms: true,
  isIndexable: true,
  sortOrder: 100,
  updatedAt: "",
});

export function SeoView() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin", "store-settings"],
    queryFn: getStoreSettings,
  });
  const pagesQuery = useQuery({
    queryKey: ["admin", "seo-pages"],
    queryFn: getAdminSeoPages,
  });
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [pages, setPages] = useState<AdminSeoPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [pageBusy, setPageBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (pagesQuery.data) setPages(pagesQuery.data);
  }, [pagesQuery.data]);

  if (settingsQuery.isLoading || pagesQuery.isLoading || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  const refreshPages = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "seo-pages"] });
  };

  const handleSaveSettings = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await saveStoreSettings(form);
      await queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
      setMessage("Global SEO settings saved to Supabase.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "SEO settings could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleSavePage = async (page: AdminSeoPage, index: number) => {
    setPageBusy(page.id || `new-${index}`);
    setMessage("");
    setError("");
    try {
      await saveAdminSeoPage(page);
      await refreshPages();
      setMessage(`${page.path || "/"} saved and queued for search discovery.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Sitemap page could not be saved.");
    } finally {
      setPageBusy("");
    }
  };

  const handleDeletePage = async (page: AdminSeoPage) => {
    if (!page.id) {
      setPages((current) => current.filter((candidate) => candidate !== page));
      return;
    }
    setPageBusy(page.id);
    setMessage("");
    setError("");
    try {
      await deleteAdminSeoPage(page.id);
      await refreshPages();
      setMessage(`${page.path || "/"} removed from the Supabase SEO registry.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Sitemap page could not be deleted.",
      );
    } finally {
      setPageBusy("");
    }
  };

  const handleIndexNow = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await submitAllUrlsToIndexNow();
      setMessage(
        `IndexNow accepted ${result.submitted} URLs with HTTP ${result.statusCode}. Search engines will verify the public key file before processing them.`,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "IndexNow submission could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const siteUrl = form.publicSiteUrl.replace(/\/+$/, "");
  const discoveryResources = [
    {
      label: "Search engines",
      title: "Dynamic XML sitemap",
      url: `${siteUrl}/sitemap.xml`,
    },
    {
      label: "Shopping",
      title: "Merchant product feed",
      url: `${siteUrl}/merchant-feed.xml`,
    },
    {
      label: "AI discovery",
      title: "LLM site guide",
      url: `${siteUrl}/llms.txt`,
    },
    {
      label: "Crawler policy",
      title: "Robots",
      url: `${siteUrl}/robots.txt`,
    },
  ];

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl tracking-tight md:text-4xl">SEO & Search Indexing</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Search metadata, sitemap URLs, AI discovery, and IndexNow controls backed by Supabase.
        </p>
      </div>

      {(settingsQuery.error || pagesQuery.error || error) && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          {error || "SEO data could not be loaded."}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-[#D8E7D2] bg-[#D8E7D2]/20 p-3 text-xs text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </p>
      )}

      <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Instant discovery
            </p>
            <h2 className="mt-1 font-serif text-2xl">IndexNow submission</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Submit all indexable Supabase pages and published products. Product changes are also
              submitted automatically with retry and exponential backoff.
            </p>
          </div>
          <button
            onClick={() => void handleIndexNow()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            Submit all URLs
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <h2 className="font-serif text-2xl">Global search metadata</h2>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Global SEO title
          </span>
          <input
            value={form.metaTitle}
            onChange={(event) => setForm({ ...form, metaTitle: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent p-2.5 font-serif text-sm outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Global meta description
          </span>
          <textarea
            rows={3}
            value={form.metaDescription}
            onChange={(event) => setForm({ ...form, metaDescription: event.target.value })}
            className="w-full resize-none rounded-lg border border-border bg-transparent p-2.5 outline-none"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Public site URL
          </span>
          <input
            type="url"
            value={form.publicSiteUrl}
            onChange={(event) => setForm({ ...form, publicSiteUrl: event.target.value })}
            className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none"
          />
        </label>

        <div className="space-y-1 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Search result preview
          </p>
          <p className="text-sm font-medium text-blue-700">{form.metaTitle}</p>
          <p className="text-[11px] text-emerald-700">{form.publicSiteUrl}</p>
          <p className="text-xs text-foreground/80">{form.metaDescription}</p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => void handleSaveSettings()}
            disabled={busy}
            className="rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save metadata"}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Supabase sitemap registry</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Product URLs are included automatically. Manage canonical non-product pages here.
            </p>
          </div>
          <button
            onClick={() => setPages((current) => [...current, emptySeoPage()])}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-muted/30"
          >
            <Plus className="h-4 w-4" />
            Add page
          </button>
        </div>

        <div className="space-y-3">
          {pages.map((page, index) => {
            const rowKey = page.id || `new-${index}`;
            const rowBusy = pageBusy === rowKey;
            return (
              <article key={rowKey} className="rounded-lg border border-border p-4">
                <div className="grid gap-3 lg:grid-cols-[180px_1fr_90px_auto]">
                  <label className="text-xs">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Path
                    </span>
                    <input
                      value={page.path}
                      onChange={(event) =>
                        setPages((current) =>
                          current.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, path: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      placeholder="/page"
                      className="w-full rounded-md border border-border bg-transparent p-2 font-mono text-xs outline-none"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Search title
                    </span>
                    <input
                      value={page.title}
                      onChange={(event) =>
                        setPages((current) =>
                          current.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, title: event.target.value }
                              : candidate,
                          ),
                        )
                      }
                      className="w-full rounded-md border border-border bg-transparent p-2 text-xs outline-none"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Order
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={page.sortOrder}
                      onChange={(event) =>
                        setPages((current) =>
                          current.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, sortOrder: Number(event.target.value) }
                              : candidate,
                          ),
                        )
                      }
                      className="w-full rounded-md border border-border bg-transparent p-2 text-xs outline-none"
                    />
                  </label>
                  <div className="flex items-end justify-end gap-2">
                    <button
                      onClick={() => void handleSavePage(page, index)}
                      disabled={rowBusy}
                      className="rounded-md bg-neutral-900 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-white disabled:opacity-50"
                    >
                      {rowBusy ? "Saving" : "Save"}
                    </button>
                    <button
                      onClick={() => void handleDeletePage(page)}
                      disabled={rowBusy}
                      aria-label={`Delete ${page.path || "home page"}`}
                      className="rounded-md border border-red-200 p-2 text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <label className="mt-3 block text-xs">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    AI and sitemap description
                  </span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={page.description}
                    onChange={(event) =>
                      setPages((current) =>
                        current.map((candidate, candidateIndex) =>
                          candidateIndex === index
                            ? { ...candidate, description: event.target.value }
                            : candidate,
                        ),
                      )
                    }
                    className="w-full resize-none rounded-md border border-border bg-transparent p-2 text-xs outline-none"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-5 text-[10px] font-semibold uppercase tracking-wider">
                  {[
                    ["Indexable", "isIndexable"],
                    ["XML sitemap", "includeInSitemap"],
                    ["LLM guide", "includeInLlms"],
                  ].map(([label, field]) => (
                    <label key={field} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(page[field as keyof AdminSeoPage])}
                        onChange={(event) =>
                          setPages((current) =>
                            current.map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, [field]: event.target.checked }
                                : candidate,
                            ),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {discoveryResources.map((resource) => (
          <a
            key={resource.url}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border bg-card p-5 transition hover:bg-muted/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {resource.label}
            </p>
            <p className="mt-2 font-serif text-lg">{resource.title}</p>
            <p className="mt-1 break-all text-[11px] text-blue-700">{resource.url}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
