import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, UploadCloud } from "lucide-react";
import {
  deleteMediaAsset,
  listProductMedia,
  uploadMediaAsset,
} from "@/lib/catalog-api";
import { AdminMediaGridSkeleton } from "@/components/loading-skeletons";

function formatBytes(bytes: number) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibraryView() {
  const maxUploadBytes = 10 * 1024 * 1024;
  const queryClient = useQueryClient();
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ["admin", "media"],
    queryFn: listProductMedia,
  });
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [operationError, setOperationError] = useState("");
  const visibleImages = images.filter((image) =>
    image.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "media"] });

  const upload = async (file: File) => {
    if (file.size > maxUploadBytes) {
      setOperationError("Images must be 10 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      setOperationError("");
      await uploadMediaAsset(file);
      await refresh();
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "Media upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (path: string) => {
    if (!confirm("Delete this media asset from Supabase Storage?")) return;
    setBusy(true);
    try {
      setOperationError("");
      await deleteMediaAsset(path);
      await refresh();
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "Media asset could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">
            Atelier Media Asset Library
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Product media stored in the Supabase product-media bucket.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition">
          <UploadCloud className="w-4 h-4" /> {busy ? "Working..." : "Upload New Asset"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              input.value = "";
              if (file) void upload(file);
            }}
          />
        </label>
      </div>

      {(error || operationError) && (
        <p className="text-xs text-red-600">
          {operationError || "Media assets could not be loaded."}
        </p>
      )}
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter media by filename..." className="w-full rounded-lg border border-border bg-card p-3 text-xs outline-none focus:border-black" />

      {isLoading ? (
        <AdminMediaGridSkeleton />
      ) : visibleImages.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No media assets are stored in the product-media bucket.
        </p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {visibleImages.map((image) => (
          <div
            key={image.id}
            className="group bg-card border border-border rounded-xl overflow-hidden shadow-xs relative"
          >
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-3 pr-9 text-[10px] space-y-0.5">
              <p className="font-semibold text-foreground truncate">{image.name}</p>
              <p className="text-muted-foreground">{formatBytes(image.size)}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove(image.path)}
              className="absolute bottom-2 right-2 rounded-md bg-white/90 p-1.5 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100"
              aria-label={`Delete ${image.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
