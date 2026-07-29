import { getProductMediaUrl } from "@/lib/supabase";
import { serverApi } from "@/lib/server-api";

export type ProductVariant = {
  id?: string;
  size?: string;
  color?: string;
  price: number;
  stock: number;
  sku: string;
};

export type Product = {
  id: string;
  databaseId: string;
  name: string;
  price: number;
  originalPrice?: number;
  material: string;
  image: string;
  imageHover?: string;
  imagePath?: string;
  imageHoverPath?: string;
  badge?: string;
  outOfStock?: boolean;
  category?: string;
  description?: string;
  shortDescription?: string;
  variants?: ProductVariant[];
  images: string[];
  categorySlug?: string;
  updatedAt: string;
};

export type AdminProduct = Product & {
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  costPrice: number;
  stock: number;
  weight: string;
  dimensions: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  urlSlug: string;
  status: "Published" | "Draft" | "Archived" | "Hidden";
  isFeatured: boolean;
  isTrending: boolean;
  isBestseller: boolean;
  tax: number;
  shippingClass: string;
  variants: ProductVariant[];
  barcode: string;
  gtin: string;
  mpn: string;
  supplier: string;
  relatedProducts: string[];
};

export type ProductReview = {
  id: string;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
};

export type StorefrontSettings = {
  storeName: string;
  tagline: string;
  contactEmail: string;
  currencyCode: string;
  freeShippingThreshold: number;
  standardShippingRate: number;
  maintenanceMode: boolean;
  metaTitle: string;
  metaDescription: string;
  publicSiteUrl: string;
};

export type HomepageBanner = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  imagePath: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
  sortOrder: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

type ProductRow = Record<string, any>;

function mapProduct(row: ProductRow): AdminProduct {
  const images = [...(row.images ?? [])].sort(
    (a: ProductRow, b: ProductRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const primary = images.find((image: ProductRow) => image.kind === "primary");
  const hover = images.find((image: ProductRow) => image.kind === "hover");
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const imageUrls = images
    .map((image: ProductRow) => getProductMediaUrl(image.object_path))
    .filter(Boolean);
  const variants = [...(row.variants ?? [])]
    .sort((a: ProductRow, b: ProductRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((variant: ProductRow) => ({
      id: variant.id,
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
      price: Number(variant.price),
      stock: variant.stock,
      sku: variant.sku,
    }));

  return {
    id: row.slug,
    databaseId: row.id,
    name: row.name,
    price: Number(row.price),
    originalPrice: row.original_price == null ? undefined : Number(row.original_price),
    material: row.material,
    image: getProductMediaUrl(primary?.object_path),
    imageHover: hover ? getProductMediaUrl(hover.object_path) : undefined,
    imagePath: primary?.object_path,
    imageHoverPath: hover?.object_path,
    badge: row.badge ?? undefined,
    outOfStock: row.stock <= 0,
    sku: row.sku,
    brand: row.brand,
    category: category?.name ?? "Uncategorised",
    subcategory: row.subcategory ?? "",
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",
    images: imageUrls,
    categorySlug: category?.slug ?? undefined,
    updatedAt: row.updated_at,
    costPrice: Number(row.cost_price ?? 0),
    stock: row.stock,
    weight: row.weight ?? "",
    dimensions: row.dimensions ?? "",
    tags: row.tags ?? [],
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    urlSlug: row.slug,
    status: row.status,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    isBestseller: row.is_bestseller,
    tax: Number(row.tax_rate ?? 0),
    shippingClass: row.shipping_class ?? "",
    variants,
    barcode: row.barcode ?? "",
    gtin: row.gtin ?? "",
    mpn: row.mpn ?? "",
    supplier: row.supplier ?? "",
    relatedProducts: [],
  };
}

export async function getProducts() {
  const data = await serverApi<ProductRow[]>("/catalog/products");
  return data.map(mapProduct);
}

export async function getCategories() {
  const data = await serverApi<ProductRow[]>("/catalog/categories");
  return data.map((category): Category => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: getProductMediaUrl(category.image_path),
  }));
}

export async function getAdminProducts() {
  const data = await serverApi<ProductRow[]>("/admin/products", { auth: true });
  return data.map(mapProduct);
}

export async function getProductBySlug(slug: string) {
  const data = await serverApi<ProductRow>(`/catalog/products/${encodeURIComponent(slug)}`);
  return mapProduct(data);
}

export async function getProductReviews(productId: string) {
  const data = await serverApi<ProductRow[]>(
    `/catalog/products/${encodeURIComponent(productId)}/reviews`,
  );
  return data.map((review) => ({
    id: review.id,
    customerName: review.customer_name,
    rating: review.rating,
    title: review.title ?? "",
    comment: review.comment,
    date: review.created_at,
    verifiedPurchase: review.is_verified_purchase,
  })) satisfies ProductReview[];
}

export async function getStorefrontSettings() {
  const settings = await serverApi<ProductRow>("/catalog/settings");
  if (!settings) throw new Error("Storefront settings are not configured.");
  return {
    storeName: settings.store_name,
    tagline: settings.tagline,
    contactEmail: settings.contact_email,
    currencyCode: settings.currency_code,
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    standardShippingRate: Number(settings.standard_shipping_rate),
    maintenanceMode: Boolean(settings.maintenance_mode),
    metaTitle: settings.meta_title,
    metaDescription: settings.meta_description,
    publicSiteUrl: settings.public_site_url.replace(/\/+$/, ""),
  } satisfies StorefrontSettings;
}

export async function getHomepageBanners() {
  const data = await serverApi<ProductRow[]>("/catalog/banners");
  return data.map((banner): HomepageBanner => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.cta_label,
    ctaUrl: banner.cta_url,
    imagePath: banner.image_path,
    imageUrl: getProductMediaUrl(banner.image_path),
    imageAlt: banner.image_alt,
    isActive: banner.is_active,
    sortOrder: banner.sort_order,
  }));
}

export async function submitProductReview(input: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}) {
  const data = await serverApi<{ id: string }>(
    `/catalog/products/${encodeURIComponent(input.productId)}/reviews`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({
        rating: input.rating,
        title: input.title,
        comment: input.comment,
      }),
    },
  );
  return data.id;
}

export async function saveProduct(product: AdminProduct) {
  await serverApi(`/admin/products${product.databaseId ? `/${product.databaseId}` : ""}`, {
    method: product.databaseId ? "PATCH" : "POST",
    auth: true,
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(product: AdminProduct) {
  await serverApi(`/admin/products/${product.databaseId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function duplicateProduct(product: AdminProduct) {
  const suffix = Date.now().toString().slice(-6);
  await saveProduct({
    ...product,
    id: `${product.id}-copy-${suffix}`,
    databaseId: "",
    urlSlug: `${product.urlSlug || product.id}-copy-${suffix}`,
    sku: `${product.sku}-COPY-${suffix}`,
    name: `${product.name} (Copy)`,
    status: "Draft",
    variants: product.variants.map((variant) => ({
      ...variant,
      id: undefined,
      sku: `${variant.sku}-COPY-${suffix}`,
    })),
  });
}

export async function updateProductStock(product: AdminProduct, delta: number) {
  const nextStock = Math.max(0, product.stock + delta);
  await serverApi(`/admin/products/${product.databaseId}/stock`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ stock: nextStock }),
  });
}

export async function setProductVisibility(product: AdminProduct, hidden: boolean) {
  await serverApi(`/admin/products/${product.databaseId}/visibility`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ hidden }),
  });
}

export async function uploadProductImage(file: File, slug: string) {
  const body = new FormData();
  body.append("image", file);
  body.append("slug", slug);
  const uploaded = await serverApi<{ path: string }>("/admin/media", {
    method: "POST",
    auth: true,
    body,
  });
  return { path: uploaded.path, url: getProductMediaUrl(uploaded.path) };
}

export type MediaAsset = {
  id: string;
  name: string;
  path: string;
  url: string;
  size: number;
  createdAt: string;
};

export async function listProductMedia() {
  const data = await serverApi<ProductRow[]>("/admin/media", { auth: true });
  return data.map((entry): MediaAsset => ({
    id: entry.id,
    name: entry.name,
    path: entry.path,
    url: getProductMediaUrl(entry.path),
    size: Number(entry.size ?? 0),
    createdAt: entry.created_at ?? "",
  }));
}

export async function uploadMediaAsset(file: File) {
  return uploadProductImage(file, "library");
}

export async function deleteMediaAsset(path: string) {
  await serverApi("/admin/media", {
    method: "DELETE",
    auth: true,
    body: JSON.stringify({ path }),
  });
}
