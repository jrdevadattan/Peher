import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  deleteHomepageBanner,
  getAdminHomepageBanners,
  saveHomepageBanner,
  uploadHomepageBannerImage,
} from "@/lib/admin-api";
import type { HomepageBanner } from "@/lib/catalog-api";
import { Skeleton } from "@/components/ui/skeleton";

const emptyBanner = (sortOrder: number): HomepageBanner => ({
  id: "",
  title: "",
  subtitle: "",
  ctaLabel: "Shop Now",
  ctaUrl: "/shop",
  imagePath: "",
  imageUrl: "",
  imageAlt: "",
  isActive: true,
  sortOrder,
});

export function HomepageBannersEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "homepage-banners"],
    queryFn: getAdminHomepageBanners,
  });
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (data) setBanners(data);
  }, [data]);

  const updateBanner = <K extends keyof HomepageBanner>(
    index: number,
    key: K,
    value: HomepageBanner[K],
  ) => {
    setBanners((current) =>
      current.map((banner, bannerIndex) =>
        bannerIndex === index ? { ...banner, [key]: value } : banner,
      ),
    );
    setMessage("");
  };

  const refreshBanners = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "homepage-banners"] }),
      queryClient.invalidateQueries({ queryKey: ["homepage-banners"] }),
    ]);
  };

  const handleSave = async (banner: HomepageBanner, index: number) => {
    if (!banner.title.trim() || !banner.imagePath) {
      setMessage("Add a title and upload a banner image before saving.");
      return;
    }
    const busyKey = banner.id || `new-${index}`;
    setBusyId(busyKey);
    setMessage("");
    try {
      const saved = await saveHomepageBanner({ ...banner, sortOrder: index });
      setBanners((current) =>
        current.map((item, itemIndex) => (itemIndex === index ? saved : item)),
      );
      await refreshBanners();
      setMessage(`"${saved.title}" is live in Supabase.`);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "The banner could not be saved.");
    } finally {
      setBusyId(null);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose a JPG, PNG, WebP, or another image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Banner images must be smaller than 10 MB.");
      return;
    }
    const busyKey = banners[index]?.id || `new-${index}`;
    setBusyId(busyKey);
    setMessage("");
    try {
      const uploaded = await uploadHomepageBannerImage(file);
      setBanners((current) =>
        current.map((banner, bannerIndex) =>
          bannerIndex === index
            ? { ...banner, imagePath: uploaded.path, imageUrl: uploaded.url }
            : banner,
        ),
      );
      setMessage("Image uploaded to Supabase Storage. Save the slide to publish it.");
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error ? uploadError.message : "The image could not be uploaded.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (banner: HomepageBanner, index: number) => {
    if (!banner.id) {
      setBanners((current) => current.filter((_, itemIndex) => itemIndex !== index));
      return;
    }
    if (!window.confirm(`Delete the "${banner.title}" homepage slide?`)) return;
    setBusyId(banner.id);
    setMessage("");
    try {
      await deleteHomepageBanner(banner);
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      await refreshBanners();
      setMessage("Homepage slide deleted.");
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error ? deleteError.message : "The banner could not be deleted.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const moveBanner = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    reordered.forEach((banner, sortOrder) => {
      banner.sortOrder = sortOrder;
    });
    setBanners(reordered);

    const persisted = reordered.filter((banner) => banner.id);
    setBusyId("reorder");
    setMessage("");
    try {
      await Promise.all(persisted.map((banner) => saveHomepageBanner(banner)));
      await refreshBanners();
      setMessage("Banner order updated.");
    } catch (reorderError) {
      setMessage(
        reorderError instanceof Error
          ? reorderError.message
          : "The banner order could not be saved.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="aspect-[16/6] w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h3 className="flex items-center gap-2 font-serif text-2xl">
            <ImageIcon className="h-5 w-5" /> Homepage Banner
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Manage the large hero slides shown at the top of the homepage. Images are stored in
            Supabase Storage and only active slides are visible to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBanners((current) => [...current, emptyBanner(current.length)])}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black"
        >
          <Plus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Homepage banners could not be loaded from Supabase.
        </p>
      )}

      {banners.length === 0 && (
        <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-neutral-50 text-center">
          <div>
            <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-serif text-xl">No homepage slides yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a slide to restore the hero banner.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {banners.map((banner, index) => {
          const busyKey = banner.id || `new-${index}`;
          const isBusy = busyId === busyKey || busyId === "reorder";
          return (
            <article
              key={banner.id || `new-banner-${index}`}
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              <div className="relative aspect-[16/6] overflow-hidden bg-[#D8E7D2]/40">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.imageAlt || banner.title || "Homepage banner preview"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    Upload a wide banner image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 text-white md:inset-x-8 md:bottom-7">
                  <p className="font-serif text-3xl leading-none md:text-5xl">
                    {banner.title || "Your headline"}
                  </p>
                  <p className="mt-2 max-w-xl text-xs text-white/90 md:text-sm">
                    {banner.subtitle || "Your supporting message appears here."}
                  </p>
                </div>
                <span
                  className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                    banner.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {banner.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {banner.isActive ? "Visible" : "Hidden"}
                </span>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
                  <BannerField
                    label="Headline"
                    value={banner.title}
                    maxLength={120}
                    onChange={(value) => updateBanner(index, "title", value)}
                  />
                  <BannerField
                    label="Image Alt Text"
                    value={banner.imageAlt}
                    maxLength={180}
                    placeholder="Describe the image for accessibility and SEO"
                    onChange={(value) => updateBanner(index, "imageAlt", value)}
                  />
                  <BannerField
                    label="Supporting Message"
                    value={banner.subtitle}
                    maxLength={240}
                    onChange={(value) => updateBanner(index, "subtitle", value)}
                  />
                  <BannerField
                    label="Button Link"
                    value={banner.ctaUrl}
                    maxLength={500}
                    placeholder="/shop or https://..."
                    onChange={(value) => updateBanner(index, "ctaUrl", value)}
                  />
                  <BannerField
                    label="Button Label"
                    value={banner.ctaLabel}
                    maxLength={40}
                    onChange={(value) => updateBanner(index, "ctaLabel", value)}
                  />
                  <label>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Banner Image
                    </span>
                    <span className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs font-medium text-neutral-900 transition hover:border-black hover:bg-neutral-50">
                      <Upload className="h-4 w-4" />
                      {banner.imagePath ? "Replace image" : "Upload image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={isBusy}
                        onChange={(event) => void handleUpload(event, index)}
                        className="sr-only"
                      />
                    </span>
                  </label>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => updateBanner(index, "isActive", !banner.isActive)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      banner.isActive
                        ? "border border-border hover:bg-neutral-100"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {banner.isActive ? "Hide slide" : "Show slide"}
                  </button>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      aria-label="Move slide up"
                      disabled={index === 0 || Boolean(busyId)}
                      onClick={() => void moveBanner(index, -1)}
                      className="rounded-lg border border-border p-2 hover:bg-neutral-100 disabled:opacity-35"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move slide down"
                      disabled={index === banners.length - 1 || Boolean(busyId)}
                      onClick={() => void moveBanner(index, 1)}
                      className="rounded-lg border border-border p-2 hover:bg-neutral-100 disabled:opacity-35"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleDelete(banner, index)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleSave(banner, index)}
                      className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> {isBusy ? "Saving..." : "Save Slide"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {message && (
        <p
          aria-live="polite"
          className="rounded-lg border border-border bg-neutral-50 p-3 text-xs font-medium"
        >
          {message}
        </p>
      )}
    </section>
  );
}

function BannerField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength: number;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-white p-2.5 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-black"
      />
    </label>
  );
}
