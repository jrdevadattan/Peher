import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ImageIcon, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import {
  deleteAdminCategory,
  getAdminCategories,
  saveAdminCategory,
  uploadCategoryImage,
  type AdminCategory,
} from "@/lib/admin-api";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

const emptyCategory = (sortOrder = 0): AdminCategory => ({
  id: "",
  name: "",
  slug: "",
  description: "",
  imagePath: "",
  imageUrl: "",
  isActive: true,
  sortOrder,
  productCount: 0,
});

export function CategoriesView() {
  const queryClient = useQueryClient();
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: getAdminCategories,
  });
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] }),
      queryClient.invalidateQueries({ queryKey: ["catalog", "categories"] }),
    ]);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMessage("");
    try {
      await saveAdminCategory(editing);
      await refresh();
      setMessage(editing.id ? "Category updated." : "Category created.");
      setEditing(null);
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : "Category could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editing) return;
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/heic",
        "image/heif",
      ].includes(file.type)
    ) {
      setMessage("Please upload a JPG, PNG, WebP, AVIF, HEIC, or HEIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Category images must be 10 MB or smaller.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const uploaded = await uploadCategoryImage(file);
      setEditing({ ...editing, imagePath: uploaded.path, imageUrl: uploaded.url });
      setMessage("Image uploaded. Save the category to publish it.");
    } catch (uploadError) {
      setMessage(
        uploadError instanceof Error
          ? uploadError.message
          : "Category image could not be uploaded.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (
      category.productCount > 0 ||
      !window.confirm(`Delete the empty category "${category.name}"?`)
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await deleteAdminCategory(category);
      await refresh();
      setMessage("Category deleted.");
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error ? deleteError.message : "Category could not be deleted.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-serif text-3xl tracking-tight md:text-4xl">Product Categories</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage storefront category cards, ordering, images, and visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(emptyCategory(categories.length * 10))}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#D8E7D2] hover:text-black"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Categories could not be loaded from the server.
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-border bg-neutral-50 p-3 text-xs" aria-live="polite">
          {message}
        </p>
      )}

      {editing && (
        <form
          onSubmit={handleSave}
          className="grid gap-5 rounded-xl border border-border bg-card p-6 shadow-xs lg:grid-cols-[260px_1fr]"
        >
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[#D8E7D2]/30">
            {editing.imageUrl ? (
              <img
                src={editing.imageUrl}
                alt={editing.name || "Category preview"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
                <div>
                  <ImageIcon className="mx-auto mb-2 h-7 w-7" />
                  Category image preview
                </div>
              </div>
            )}
            <label className="absolute inset-x-3 bottom-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold shadow-sm">
              <Upload className="h-4 w-4" /> {editing.imagePath ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
                className="sr-only"
                disabled={busy}
                onChange={(event) => void handleUpload(event)}
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="font-serif text-2xl">
                {editing.id ? "Edit Category" : "New Category"}
              </h2>
              <button
                type="button"
                aria-label="Close category editor"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border p-2 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 text-xs md:grid-cols-2">
              <CategoryField
                label="Category Name"
                value={editing.name}
                required
                onChange={(name) =>
                  setEditing({
                    ...editing,
                    name,
                    slug: editing.id
                      ? editing.slug
                      : name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, ""),
                  })
                }
              />
              <CategoryField
                label="URL Slug"
                value={editing.slug}
                required
                onChange={(slug) => setEditing({ ...editing, slug })}
              />
              <CategoryField
                label="Description"
                value={editing.description}
                onChange={(description) => setEditing({ ...editing, description })}
              />
              <label>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sort Order
                </span>
                <input
                  type="number"
                  min={0}
                  value={editing.sortOrder}
                  onChange={(event) =>
                    setEditing({ ...editing, sortOrder: Number(event.target.value) })
                  }
                  className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none focus:border-black"
                />
              </label>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setEditing({ ...editing, isActive: !editing.isActive })}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                  editing.isActive ? "border border-border" : "bg-amber-100 text-amber-900"
                }`}
              >
                {editing.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {editing.isActive ? "Visible on storefront" : "Hidden from storefront"}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save Category"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Category</th>
              <th className="hidden p-4 md:table-cell">Slug</th>
              <th className="p-4">Products</th>
              <th className="p-4">Visibility</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <AdminTableRowsSkeleton rows={5} columns={5} />
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-neutral-100">
                        {category.imageUrl && (
                          <img
                            src={category.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-muted-foreground">
                          {category.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-4 font-mono text-muted-foreground md:table-cell">
                    /{category.slug}
                  </td>
                  <td className="p-4 font-semibold">{category.productCount}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase ${
                        category.isActive
                          ? "bg-[#D8E7D2] text-black"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {category.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditing(category)}
                        className="rounded-lg border border-border p-2 hover:bg-neutral-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${category.name}`}
                        disabled={busy || category.productCount > 0}
                        title={
                          category.productCount > 0
                            ? "Move or delete products before deleting this category"
                            : "Delete category"
                        }
                        onClick={() => void handleDelete(category)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-transparent p-2.5 outline-none focus:border-black"
      />
    </label>
  );
}
