const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const requireAuth = require("../middleware/auth");
const requirePermission = require("../middleware/requirePermission");
const supabase = require("../lib/supabase");
const { publicError, safeErrorMessage } = require("../lib/http-error");
const { normalizeUploadedImage } = require("../lib/image-upload");
const { submitIndexNow } = require("../lib/indexnow");
const { keyMatchesMode } = require("../lib/razorpay-security");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (
      !file.mimetype.startsWith("image/") &&
      file.mimetype !== "application/octet-stream"
    ) {
      callback(new Error("Only image uploads are supported here."));
      return;
    }
    callback(null, true);
  },
});

router.use(requireAuth);

const productSelect = `
  id, slug, sku, name, brand, subcategory, description, short_description,
  material, price, original_price, cost_price, stock, weight, dimensions, tags,
  seo_title, seo_description, status, is_featured, is_trending, is_bestseller,
  badge, tax_rate, shipping_class, barcode, gtin, mpn, supplier, created_at,
  updated_at, category:categories(name, slug),
  images:product_images(id, bucket_id, object_path, kind, alt_text, sort_order),
  variants:product_variants(id, size, color, price, stock, sku, sort_order)
`;

async function logAction(req, action, details) {
  await supabase.from("activity_logs").insert({
    actor_id: req.user.id,
    actor_name: req.admin?.display_name || req.user.email,
    actor_role: req.admin?.role || "Admin",
    action,
    details,
    ip_address: req.ip,
  });
}

async function submitSitePaths(paths) {
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("public_site_url")
    .eq("id", "default")
    .single();
  if (error || !settings?.public_site_url) {
    throw new Error("The public site URL is not configured.");
  }

  const urls = paths.map((path) => new URL(path || "/", settings.public_site_url).toString());
  return submitIndexNow(settings.public_site_url, urls);
}

async function notifyIndexNowSafely(req, paths) {
  try {
    const result = await submitSitePaths(paths);
    await logAction(req, "IndexNow Submitted", `${result.submitted} changed URLs accepted`);
  } catch (error) {
    await logAction(
      req,
      "IndexNow Retry Required",
      safeErrorMessage(error, "The changed URLs could not be submitted."),
    );
  }
}

function requireAdminRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "This action requires elevated administrator access." });
    }
    next();
  };
}

function validateStoredMediaPath(value, label = "Image") {
  const path = String(value || "").trim();
  if (!path || !path.startsWith("catalog/") || path.includes("..") || path.includes("\\")) {
    throw publicError(`${label} must be an uploaded PEHER media asset.`);
  }
  return path;
}

async function validateUpload(file) {
  const normalized = await normalizeUploadedImage(file);
  if (!normalized)
    throw publicError("The file content is not a supported JPG, PNG, WebP, AVIF, HEIC, or HEIF image.");
  return normalized;
}

function uploadStorageError(error, fallback) {
  if (!error) return fallback;
  const message = String(error.message || error.error || "").trim();
  if (!message) return fallback;
  if (/mime|content.?type|allowed/i.test(message)) {
    return `${fallback} Supabase Storage rejected the file type after upload validation. Try JPG, PNG, WebP, or AVIF.`;
  }
  return `${fallback} ${message}`;
}

function sanitizeProductTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const cleaned = [];
  for (const tag of tags) {
    const label = String(tag || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    cleaned.push(label);
    if (cleaned.length >= 12) break;
  }
  return cleaned;
}

router.get("/session", async (req, res) => {
  const [{ data: membership, error }, { data: profile }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("display_name, email, role, permissions, two_factor_enabled, is_active")
      .eq("user_id", req.user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("avatar_path, last_login_at")
      .eq("id", req.user.id)
      .maybeSingle(),
  ]);
  if (error) return res.status(500).json({ error: "Could not verify admin access" });
  if (!membership?.is_active) return res.status(403).json({ error: "Admin access is not active" });
  res.json({ membership, profile });
});

router.post("/session/touch", async (req, res) => {
  const { data: membership } = await supabase
    .from("admin_users")
    .select("is_active")
    .eq("user_id", req.user.id)
    .maybeSingle();
  if (!membership?.is_active) return res.status(403).json({ error: "Admin access is not active" });
  const { error } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", req.user.id);
  if (error) return res.status(500).json({ error: "Could not update the admin session" });
  res.status(204).end();
});

router.get("/products", requirePermission("products"), async (_req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load products" });
  res.json(data || []);
});

function productPayload(input, categoryId) {
  const slug = String(input.urlSlug || input.id || input.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const sku = String(input.sku || "").trim();
  const name = String(input.name || "").trim();
  if (!slug || !sku || name.length < 2)
    throw publicError("Product name, slug, and SKU are required.");
  if (!["Published", "Draft", "Archived", "Hidden"].includes(input.status)) {
    throw publicError("Choose a valid product status.");
  }
  return {
    slug,
    sku,
    name,
    brand: String(input.brand || "PEHER Atelier").trim(),
    category_id: categoryId,
    subcategory: String(input.subcategory || "").trim() || null,
    description: String(input.description || ""),
    short_description: String(input.shortDescription || ""),
    material: String(input.material || ""),
    price: Math.max(0, Number(input.price) || 0),
    original_price: input.originalPrice == null ? null : Number(input.originalPrice),
    cost_price: Math.max(0, Number(input.costPrice) || 0),
    stock: Math.max(0, Math.trunc(Number(input.stock) || 0)),
    weight: String(input.weight || "").trim() || null,
    dimensions: String(input.dimensions || "").trim() || null,
    tags: sanitizeProductTags(input.tags),
    seo_title: String(input.seoTitle || "").trim() || null,
    seo_description: String(input.seoDescription || "").trim() || null,
    status: input.status,
    is_featured: Boolean(input.isFeatured),
    is_trending: Boolean(input.isTrending),
    is_bestseller: Boolean(input.isBestseller),
    badge:
      String(input.badge || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 32) || null,
    tax_rate: 0,
    shipping_class: String(input.shippingClass || "").trim() || null,
    barcode: String(input.barcode || "").trim() || null,
    gtin: String(input.gtin || "").trim() || null,
    mpn: String(input.mpn || "").trim() || null,
    supplier: String(input.supplier || "").trim() || null,
  };
}

async function saveProduct(req, res) {
  try {
    const categoryName = String(req.body.category || "").trim();
    if (!categoryName) throw publicError("Choose a category.");
    const categorySlug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .upsert({ name: categoryName, slug: categorySlug, is_active: true }, { onConflict: "slug" })
      .select("id")
      .single();
    if (categoryError) throw categoryError;

    const payload = productPayload(req.body, category.id);
    const query = req.params.id
      ? supabase.from("products").update(payload).eq("id", req.params.id)
      : supabase.from("products").insert({ ...payload, created_by: req.user.id });
    const { data: product, error: productError } = await query.select("id").single();
    if (productError) throw productError;

    const variants = Array.isArray(req.body.variants) ? req.body.variants : [];
    const { error: clearVariantsError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", product.id);
    if (clearVariantsError) throw clearVariantsError;
    if (variants.length) {
      const { error: variantsError } = await supabase.from("product_variants").insert(
        variants.slice(0, 100).map((variant, index) => ({
          product_id: product.id,
          size: variant.size || null,
          color: variant.color || null,
          price: Math.max(0, Number(variant.price) || 0),
          stock: Math.max(0, Math.trunc(Number(variant.stock) || 0)),
          sku: String(variant.sku || "").trim(),
          sort_order: index * 10,
        })),
      );
      if (variantsError) throw variantsError;
    }

    const { error: clearImagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", product.id);
    if (clearImagesError) throw clearImagesError;
    const images = [
      req.body.imagePath
        ? {
            product_id: product.id,
            object_path: validateStoredMediaPath(req.body.imagePath, "Primary image"),
            kind: "primary",
            alt_text: payload.name,
            sort_order: 0,
          }
        : null,
      req.body.imageHoverPath
        ? {
            product_id: product.id,
            object_path: validateStoredMediaPath(req.body.imageHoverPath, "Hover image"),
            kind: "hover",
            alt_text: payload.name,
            sort_order: 0,
          }
        : null,
    ].filter(Boolean);
    if (images.length) {
      const { error: imagesError } = await supabase.from("product_images").insert(images);
      if (imagesError) throw imagesError;
    }
    await logAction(req, req.params.id ? "Product Updated" : "Product Created", payload.name);
    if (payload.status === "Published") {
      await notifyIndexNowSafely(req, [
        `/product/${payload.slug}`,
        "/sitemap.xml",
        "/merchant-feed.xml",
        "/llms.txt",
      ]);
    }
    res.status(req.params.id ? 200 : 201).json({ id: product.id });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Product could not be saved.") });
  }
}

router.post("/products", requirePermission("products"), saveProduct);
router.patch("/products/:id", requirePermission("products"), saveProduct);

router.delete("/products/:id", requirePermission("products"), async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", req.params.id)
    .select("name, sku, slug")
    .single();
  if (error) return res.status(400).json({ error: "Product could not be deleted." });
  await logAction(req, "Product Deleted", `${data.name} (${data.sku})`);
  await notifyIndexNowSafely(req, [
    `/product/${data.slug}`,
    "/sitemap.xml",
    "/merchant-feed.xml",
    "/llms.txt",
  ]);
  res.status(204).end();
});

router.patch("/products/:id/stock", requirePermission("inventory"), async (req, res) => {
  const stock = Math.max(0, Math.trunc(Number(req.body.stock) || 0));
  const { data, error } = await supabase
    .from("products")
    .update({ stock })
    .eq("id", req.params.id)
    .select("name")
    .single();
  if (error) return res.status(400).json({ error: "Stock could not be updated." });
  await logAction(req, "Stock Adjustment", `${data.name} changed to ${stock}`);
  res.json({ stock });
});

router.patch("/products/:id/visibility", requirePermission("products"), async (req, res) => {
  const status = req.body.hidden ? "Hidden" : "Published";
  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", req.params.id)
    .select("name, sku, slug")
    .single();
  if (error) return res.status(400).json({ error: "Product visibility could not be updated." });
  await logAction(req, status === "Hidden" ? "Product Hidden" : "Product Published", data.name);
  await notifyIndexNowSafely(req, [
    `/product/${data.slug}`,
    "/sitemap.xml",
    "/merchant-feed.xml",
    "/llms.txt",
  ]);
  res.json({ status });
});

router.post("/media", requirePermission("media"), upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
    const { extension, mimeType, buffer } = await validateUpload(req.file);
    const slug = String(req.body.slug || "library")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const path = `catalog/${slug || "library"}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("product-media").upload(path, buffer, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });
    if (error) return res.status(400).json({ error: uploadStorageError(error, "Image could not be uploaded.") });
    res.status(201).json({ path });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Image could not be uploaded.") });
  }
});

router.get("/media", requirePermission("media"), async (_req, res) => {
  const { data: folders, error } = await supabase.storage
    .from("product-media")
    .list("catalog", { limit: 100, sortBy: { column: "name", order: "asc" } });
  if (error) return res.status(500).json({ error: "Media library could not be loaded." });
  const folderNames = (folders || []).filter((entry) => !entry.id).map((entry) => entry.name);
  const nested = await Promise.all(
    folderNames.map(async (folder) => {
      const { data, error: folderError } = await supabase.storage
        .from("product-media")
        .list(`catalog/${folder}`, {
          limit: 250,
          sortBy: { column: "created_at", order: "desc" },
        });
      if (folderError) throw folderError;
      return (data || [])
        .filter((entry) => entry.id)
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          path: `catalog/${folder}/${entry.name}`,
          size: Number(entry.metadata?.size || 0),
          created_at: entry.created_at || "",
        }));
    }),
  );
  res.json(nested.flat());
});

router.delete("/media", requirePermission("media"), async (req, res) => {
  const path = String(req.body.path || "");
  if (!path.startsWith("catalog/") || path.includes("..")) {
    return res.status(400).json({ error: "Invalid media path" });
  }
  const { error } = await supabase.storage.from("product-media").remove([path]);
  if (error) return res.status(400).json({ error: "Media asset could not be deleted." });
  await logAction(req, "Media Deleted", path);
  res.status(204).end();
});

function categoryPayload(input) {
  const name = String(input.name || "").trim();
  const slug = String(input.slug || name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (name.length < 2 || !slug) throw publicError("Category name is required.");
  return {
    name,
    slug,
    description: String(input.description || "").trim() || null,
    image_path: input.imagePath ? validateStoredMediaPath(input.imagePath, "Category image") : null,
    is_active: input.isActive !== false,
    sort_order: Math.max(0, Number(input.sortOrder) || 0),
  };
}

router.get("/categories", requirePermission("categories"), async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(id)")
    .order("sort_order")
    .order("name");
  if (error) return res.status(500).json({ error: "Could not load categories" });
  res.json(
    (data || []).map((category) => ({
      ...category,
      product_count: category.products?.length || 0,
      products: undefined,
    })),
  );
});

router.post("/categories", requirePermission("categories"), async (req, res) => {
  try {
    const payload = categoryPayload(req.body);
    const { data, error } = await supabase.from("categories").insert(payload).select("*").single();
    if (error) throw error;
    await logAction(req, "Category Created", data.name);
    res.status(201).json({ ...data, product_count: 0 });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Category could not be created.") });
  }
});

router.patch("/categories/:id", requirePermission("categories"), async (req, res) => {
  try {
    const payload = categoryPayload(req.body);
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    await logAction(req, "Category Updated", data.name);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Category could not be updated.") });
  }
});

router.delete("/categories/:id", requirePermission("categories"), async (req, res) => {
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", req.params.id);
  if (count) {
    return res.status(409).json({ error: "Move or delete the products in this category first." });
  }
  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", req.params.id)
    .select("name")
    .single();
  if (error) return res.status(400).json({ error: "Category could not be deleted." });
  await logAction(req, "Category Deleted", data.name);
  res.status(204).end();
});

router.post(
  "/categories/image",
  requirePermission("media"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Choose an image to upload." });
      const { extension, mimeType, buffer } = await validateUpload(req.file);
      const path = `catalog/categories/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("product-media").upload(path, buffer, {
        cacheControl: "31536000",
        contentType: mimeType,
        upsert: false,
      });
      if (error) return res.status(400).json({ error: uploadStorageError(error, "Category image could not be uploaded.") });
      res.status(201).json({ path });
    } catch (error) {
      res
        .status(400)
        .json({ error: safeErrorMessage(error, "Category image could not be uploaded.") });
    }
  },
);

router.get("/coupons", requirePermission("coupons"), async (_req, res) => {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load coupons" });
  res.json(data || []);
});

function couponPayload(input) {
  const code = String(input.code || "")
    .trim()
    .toUpperCase();
  const type = input.type;
  const value = Number(input.value);
  const minPurchase = Number(input.minPurchase || 0);
  const usageLimit = input.usageLimit ? Number(input.usageLimit) : null;
  const perCustomer = Number(input.maxRedemptionsPerCustomer || 1);
  const maxDiscount = input.maxDiscountAmount ? Number(input.maxDiscountAmount) : null;
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw publicError("Use 3-32 letters, numbers, - or _.");
  }
  if (!["Percentage", "Flat", "FreeShipping"].includes(type)) {
    throw publicError("Choose a valid discount type.");
  }
  if (type === "Percentage" && (value <= 0 || value > 100)) {
    throw publicError("Percentage discounts must be between 1 and 100.");
  }
  if (type === "Flat" && value <= 0) {
    throw publicError("Flat discounts must be greater than zero.");
  }
  if (minPurchase < 0 || (usageLimit !== null && usageLimit < 1) || perCustomer < 1) {
    throw publicError("Coupon limits must be positive.");
  }
  return {
    code,
    type,
    value: type === "FreeShipping" ? 0 : value,
    min_purchase: minPurchase,
    expires_at: input.expiryDate
      ? new Date(`${input.expiryDate}T23:59:59.999Z`).toISOString()
      : null,
    usage_limit: usageLimit,
    max_redemptions_per_customer: perCustomer,
    max_discount_amount: type === "Percentage" ? maxDiscount : null,
    status: input.status || "Active",
  };
}

router.post("/coupons", requirePermission("coupons"), async (req, res) => {
  try {
    const payload = couponPayload(req.body);
    const { data, error } = await supabase.from("coupons").insert(payload).select("*").single();
    if (error) throw error;
    await logAction(req, "Coupon Created", data.code);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Coupon could not be created.") });
  }
});

router.patch("/coupons/:id", requirePermission("coupons"), async (req, res) => {
  try {
    const payload = couponPayload(req.body);
    const { data, error } = await supabase
      .from("coupons")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    await logAction(req, "Coupon Updated", data.code);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Coupon could not be updated.") });
  }
});

router.delete("/coupons/:id", requirePermission("coupons"), async (req, res) => {
  const { count } = await supabase
    .from("coupon_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("coupon_id", req.params.id);
  if (count) {
    const { data, error } = await supabase
      .from("coupons")
      .update({ status: "Disabled" })
      .eq("id", req.params.id)
      .select("code")
      .single();
    if (error) return res.status(400).json({ error: "Coupon could not be disabled." });
    await logAction(req, "Coupon Disabled", data.code);
    return res.json({ disabled: true });
  }
  const { data, error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", req.params.id)
    .select("code")
    .single();
  if (error) return res.status(400).json({ error: "Coupon could not be deleted." });
  await logAction(req, "Coupon Deleted", data.code);
  res.status(204).end();
});

router.get("/orders", requirePermission("orders"), async (_req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(id, product_id, product_name, unit_price, quantity, size, image_path), timeline:order_timeline(id, title, note, created_at)",
    )
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load orders" });
  res.json(data || []);
});

router.patch("/orders/:id/status", requirePermission("orders"), async (req, res) => {
  const allowed = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Refunded",
  ];
  const status = req.body.deliveryStatus;
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid order status" });
  const { data, error } = await supabase
    .from("orders")
    .update({ delivery_status: status })
    .eq("id", req.params.id)
    .select("order_number")
    .single();
  if (error) return res.status(400).json({ error: "Order status could not be updated." });
  const { error: timelineError } = await supabase.from("order_timeline").insert({
    order_id: req.params.id,
    title: `Status changed to ${status}`,
  });
  if (timelineError) return res.status(400).json({ error: "Order timeline could not be updated." });
  await logAction(req, "Order Status Updated", `${data.order_number} changed to ${status}`);
  res.json({ status });
});

router.get("/customers", requirePermission("customers"), async (_req, res) => {
  const [
    { data: profiles, error: profilesError },
    { data: orders, error: ordersError },
    { data: admins, error: adminsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, status, tags, last_login_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("orders").select("customer_id, customer_email, shipping_address, total"),
    supabase.from("admin_users").select("user_id"),
  ]);
  if (profilesError || ordersError || adminsError) {
    return res.status(500).json({ error: "Could not load customers" });
  }
  const adminIds = new Set((admins || []).map((admin) => admin.user_id));
  res.json({ profiles: (profiles || []).filter((profile) => !adminIds.has(profile.id)), orders });
});

router.patch("/customers/:id/status", requirePermission("customers"), async (req, res) => {
  const status = req.body.status;
  if (!["Active", "Blocked"].includes(status)) {
    return res.status(400).json({ error: "Invalid customer status" });
  }
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", req.params.id)
    .select("full_name")
    .single();
  if (error) return res.status(400).json({ error: "Customer status could not be updated." });
  await logAction(
    req,
    "Customer Status Updated",
    `${data.full_name || "Customer"} changed to ${status}`,
  );
  res.json({ status });
});

router.get("/reviews", requirePermission("reviews"), async (_req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load reviews" });
  res.json(data || []);
});

router.patch("/reviews/:id", requirePermission("reviews"), async (req, res) => {
  const changes = {};
  if (req.body.status !== undefined) {
    if (!["Approved", "Pending", "Rejected"].includes(req.body.status)) {
      return res.status(400).json({ error: "Invalid review status" });
    }
    changes.status = req.body.status;
  }
  if (req.body.reply !== undefined) {
    const reply = String(req.body.reply || "").trim();
    if (reply.length > 2000) {
      return res.status(400).json({ error: "Review replies must be 2,000 characters or fewer." });
    }
    changes.reply = reply || null;
  }
  const { data, error } = await supabase
    .from("reviews")
    .update(changes)
    .eq("id", req.params.id)
    .select("product:products(name)")
    .single();
  if (error) return res.status(400).json({ error: "Review could not be updated." });
  const product = Array.isArray(data.product) ? data.product[0] : data.product;
  await logAction(req, "Review Updated", product?.name || "Product review");
  res.json(data);
});

router.get("/activity", requirePermission("settings"), async (_req, res) => {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) return res.status(500).json({ error: "Could not load activity logs" });
  res.json(data || []);
});

router.get("/notifications", requirePermission("orders"), async (req, res) => {
  const [{ data: notifications, error }, { data: reads, error: readsError }] = await Promise.all([
    supabase
      .from("admin_notifications")
      .select("id, type, severity, title, message, order_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("admin_notification_reads")
      .select("notification_id")
      .eq("admin_user_id", req.user.id),
  ]);
  if (error || readsError) {
    return res.status(500).json({ error: "Could not load notifications" });
  }
  const readIds = new Set((reads || []).map((read) => read.notification_id));
  res.json(
    (notifications || []).map((notification) => ({
      ...notification,
      is_read: readIds.has(notification.id),
    })),
  );
});

router.post("/notifications/read", requirePermission("orders"), async (req, res) => {
  const ids = Array.isArray(req.body.notificationIds)
    ? [...new Set(req.body.notificationIds.map(String))].slice(0, 100)
    : [];
  if (!ids.length) return res.status(204).end();
  const { error } = await supabase.from("admin_notification_reads").upsert(
    ids.map((notificationId) => ({
      notification_id: notificationId,
      admin_user_id: req.user.id,
    })),
    { onConflict: "notification_id,admin_user_id", ignoreDuplicates: true },
  );
  if (error) return res.status(400).json({ error: "Notification status could not be updated." });
  res.status(204).end();
});

router.post("/notifications/retry", requirePermission("orders"), async (_req, res) => {
  const { data, error } = await supabase.rpc("retry_order_notifications");
  if (error) return res.status(400).json({ error: "Notifications could not be retried." });
  res.json({ recovered: Number(data || 0) });
});

router.get("/memberships", requirePermission("settings"), async (_req, res) => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, display_name, email, role, is_active")
    .order("created_at");
  if (error) return res.status(500).json({ error: "Could not load admin memberships" });
  res.json(data || []);
});

function seoPagePayload(input, userId) {
  const rawPath = String(input.path ?? "").trim();
  const path = rawPath === "/" ? "" : rawPath.replace(/\/+$/, "");
  if (path && (!/^\/[a-z0-9][a-z0-9/_-]*$/.test(path) || path.includes("//"))) {
    throw publicError("Use a lowercase site path such as /about or /journal/story.");
  }

  const title = String(input.title || "").trim();
  const description = String(input.description || "").trim();
  if (title.length < 2 || title.length > 120) {
    throw publicError("SEO page titles must contain 2 to 120 characters.");
  }
  if (description.length > 500) {
    throw publicError("SEO page descriptions cannot exceed 500 characters.");
  }

  return {
    path,
    title,
    description,
    include_in_sitemap: input.includeInSitemap !== false,
    include_in_llms: input.includeInLlms !== false,
    is_indexable: input.isIndexable !== false,
    sort_order: Math.max(0, Math.trunc(Number(input.sortOrder) || 0)),
    updated_by: userId,
  };
}

router.get("/seo/pages", requirePermission("seo"), async (_req, res) => {
  const { data, error } = await supabase
    .from("seo_pages")
    .select("*")
    .order("sort_order")
    .order("path");
  if (error) return res.status(500).json({ error: "Could not load sitemap pages" });
  res.json(data || []);
});

router.post("/seo/pages", requirePermission("seo"), async (req, res) => {
  try {
    const payload = seoPagePayload(req.body, req.user.id);
    const { data, error } = await supabase.from("seo_pages").insert(payload).select("*").single();
    if (error) throw error;
    await logAction(req, "SEO Page Added", data.path || "/");
    await notifyIndexNowSafely(req, [data.path || "/", "/sitemap.xml", "/llms.txt"]);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "SEO page could not be added.") });
  }
});

router.patch("/seo/pages/:id", requirePermission("seo"), async (req, res) => {
  try {
    const payload = seoPagePayload(req.body, req.user.id);
    const { data, error } = await supabase
      .from("seo_pages")
      .update(payload)
      .eq("id", req.params.id)
      .select("*")
      .single();
    if (error) throw error;
    await logAction(req, "SEO Page Updated", data.path || "/");
    await notifyIndexNowSafely(req, [data.path || "/", "/sitemap.xml", "/llms.txt"]);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "SEO page could not be updated.") });
  }
});

router.delete("/seo/pages/:id", requirePermission("seo"), async (req, res) => {
  const { data, error } = await supabase
    .from("seo_pages")
    .delete()
    .eq("id", req.params.id)
    .select("path")
    .single();
  if (error) return res.status(400).json({ error: "SEO page could not be deleted." });
  await logAction(req, "SEO Page Deleted", data.path || "/");
  await notifyIndexNowSafely(req, [data.path || "/", "/sitemap.xml", "/llms.txt"]);
  res.status(204).end();
});

router.post("/seo/indexnow", requirePermission("seo"), async (req, res) => {
  try {
    const [{ data: pages, error: pagesError }, { data: products, error: productsError }] =
      await Promise.all([
        supabase.from("seo_pages").select("path").eq("is_indexable", true),
        supabase.from("products").select("slug").eq("status", "Published"),
      ]);
    if (pagesError || productsError) throw pagesError || productsError;

    const paths = [
      ...(pages || []).map((page) => page.path || "/"),
      ...(products || []).map((product) => `/product/${product.slug}`),
      "/sitemap.xml",
      "/merchant-feed.xml",
      "/llms.txt",
      "/robots.txt",
    ];
    const result = await submitSitePaths(paths);
    await logAction(req, "IndexNow Full Submission", `${result.submitted} URLs accepted`);
    res.json(result);
  } catch (error) {
    res.status(502).json({
      error: safeErrorMessage(error, "IndexNow did not accept the URL submission."),
    });
  }
});

router.get("/settings", requirePermission("settings"), async (_req, res) => {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", "default")
    .single();
  if (error) return res.status(500).json({ error: "Could not load store settings" });
  res.json(data);
});

router.patch("/settings", requirePermission("settings"), async (req, res) => {
  const input = req.body;
  const payload = {
    store_name: String(input.storeName || "").trim(),
    tagline: String(input.tagline || "").trim(),
    contact_email: String(input.contactEmail || "").trim(),
    currency_code: String(input.currencyCode || "INR")
      .trim()
      .toUpperCase()
      .slice(0, 3),
    gst_percentage: 0,
    free_shipping_threshold: Math.max(0, Number(input.freeShippingThreshold) || 0),
    standard_shipping_rate: Math.max(0, Number(input.standardShippingRate) || 0),
    prices_include_tax: true,
    shipping_enabled: Boolean(input.shippingEnabled),
    maintenance_mode: Boolean(input.maintenanceMode),
    meta_title: String(input.metaTitle || "").trim(),
    meta_description: String(input.metaDescription || "").trim(),
    public_site_url: String(input.publicSiteUrl || "")
      .trim()
      .replace(/\/+$/, ""),
    updated_by: req.user.id,
  };
  if (!payload.store_name || !payload.contact_email || !payload.public_site_url) {
    return res.status(400).json({ error: "Store name, contact email, and site URL are required" });
  }
  let siteUrl;
  try {
    siteUrl = new URL(payload.public_site_url);
  } catch {
    return res.status(400).json({ error: "Enter a valid public site URL." });
  }
  const localDevelopmentUrl =
    process.env.NODE_ENV !== "production" &&
    siteUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(siteUrl.hostname);
  if (siteUrl.protocol !== "https:" && !localDevelopmentUrl) {
    return res.status(400).json({ error: "The public site URL must use HTTPS." });
  }
  payload.public_site_url = siteUrl.toString().replace(/\/+$/, "");
  const { error } = await supabase.from("store_settings").update(payload).eq("id", "default");
  if (error) return res.status(400).json({ error: "Store settings could not be updated." });
  await logAction(req, "Store Settings Updated", "Store configuration saved");
  res.status(204).end();
});

router.get("/banners", requirePermission("settings"), async (_req, res) => {
  const { data, error } = await supabase
    .from("homepage_banners")
    .select("id, title, subtitle, cta_label, cta_url, image_path, image_alt, is_active, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) return res.status(500).json({ error: "Could not load homepage banners" });
  res.json(data || []);
});

function bannerPayload(input) {
  const payload = {
    title: String(input.title || "").trim(),
    subtitle: String(input.subtitle || "").trim(),
    cta_label: String(input.ctaLabel || "").trim(),
    cta_url: String(input.ctaUrl || "").trim(),
    image_path: String(input.imagePath || "").trim(),
    image_alt: String(input.imageAlt || "").trim(),
    is_active: Boolean(input.isActive),
    sort_order: Math.max(0, Math.trunc(Number(input.sortOrder) || 0)),
  };
  if (!payload.title || !payload.cta_label || !payload.cta_url || !payload.image_path) {
    throw publicError("Banner title, call to action, URL, and image are required.");
  }
  const isRelativeUrl =
    payload.cta_url.startsWith("/") &&
    !payload.cta_url.startsWith("//") &&
    !payload.cta_url.includes("\\");
  let isSecureUrl = false;
  if (!isRelativeUrl) {
    try {
      isSecureUrl = new URL(payload.cta_url).protocol === "https:";
    } catch {
      isSecureUrl = false;
    }
  }
  if (!isRelativeUrl && !isSecureUrl) {
    throw publicError("Banner links must use a local path or a secure HTTPS URL.");
  }
  payload.image_path = validateStoredMediaPath(payload.image_path, "Banner image");
  return payload;
}

router.post("/banners", requirePermission("settings"), async (req, res) => {
  try {
    const payload = bannerPayload(req.body);
    const { data, error } = await supabase
      .from("homepage_banners")
      .insert({ ...payload, created_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    await logAction(req, "Homepage Banner Saved", payload.title);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Homepage banner could not be saved.") });
  }
});

router.patch("/banners/:id", requirePermission("settings"), async (req, res) => {
  try {
    const payload = bannerPayload(req.body);
    const { data, error } = await supabase
      .from("homepage_banners")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    await logAction(req, "Homepage Banner Saved", payload.title);
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Homepage banner could not be saved.") });
  }
});

router.delete("/banners/:id", requirePermission("settings"), async (req, res) => {
  const { data, error } = await supabase
    .from("homepage_banners")
    .delete()
    .eq("id", req.params.id)
    .select("title")
    .single();
  if (error) return res.status(400).json({ error: "Homepage banner could not be deleted." });
  await logAction(req, "Homepage Banner Deleted", data.title);
  res.status(204).end();
});

router.get("/marketing", requirePermission("marketing"), async (_req, res) => {
  const [{ count, error: countError }, { data, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("marketing_opt_in", true),
    supabase
      .from("marketing_campaigns")
      .select("id, subject, content, status, audience_count, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (countError || error) return res.status(500).json({ error: "Could not load marketing data" });
  res.json({
    subscriber_count: count || 0,
    delivery_configured: Boolean(process.env.RESEND_API_KEY),
    campaigns: data || [],
  });
});

router.post("/marketing", requirePermission("marketing"), async (req, res) => {
  const subject = String(req.body.subject || "").trim();
  const content = String(req.body.content || "").trim();
  if (subject.length < 2 || subject.length > 200 || content.length < 2 || content.length > 20000) {
    return res.status(400).json({ error: "Add a valid campaign subject and message" });
  }
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("marketing_opt_in", true);
  if (countError) return res.status(500).json({ error: "Could not count subscribers" });
  const { error } = await supabase.from("marketing_campaigns").insert({
    subject,
    content,
    status: "Queued",
    audience_count: count || 0,
    created_by: req.user.id,
    queued_at: new Date().toISOString(),
  });
  if (error) return res.status(400).json({ error: "Marketing campaign could not be queued." });
  await logAction(req, "Marketing Campaign Queued", subject);
  res.status(201).json({ audienceCount: count || 0 });
});

router.patch("/marketing/:id", requirePermission("marketing"), async (req, res) => {
  const status = String(req.body.status || "");
  if (!["Queued", "Cancelled"].includes(status)) {
    return res.status(400).json({ error: "Campaigns can only be queued or cancelled here." });
  }
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({
      status,
      queued_at: status === "Queued" ? new Date().toISOString() : null,
      error_message: null,
    })
    .eq("id", req.params.id)
    .in("status", ["Draft", "Queued", "Cancelled"])
    .select("subject, status")
    .single();
  if (error) return res.status(400).json({ error: "Marketing campaign could not be updated." });
  await logAction(req, `Marketing Campaign ${status}`, data.subject);
  res.json(data);
});

function parseReportRange(query) {
  const now = new Date();
  const from = query.from
    ? new Date(String(query.from))
    : new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const to = query.to ? new Date(String(query.to)) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw publicError("Choose a valid report date range.");
  }
  to.setHours(23, 59, 59, 999);
  const maximumRangeMs = 5 * 366 * 24 * 60 * 60 * 1000;
  if (to.getTime() - from.getTime() > maximumRangeMs) {
    throw publicError("Sales reports are limited to a five-year date range.");
  }
  return { from, to };
}

router.get("/analytics", requirePermission("analytics"), async (req, res) => {
  try {
    const { from, to } = parseReportRange(req.query);
    let query = supabase
      .from("orders")
      .select(
        "id, order_number, customer_id, customer_name, customer_email, shipping_address, subtotal, shipping_cost, tax_amount, discount_amount, total, payment_status, delivery_status, created_at, items:order_items(product_id, product_name, quantity, unit_price)",
      )
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at");
    if (req.query.deliveryStatus && req.query.deliveryStatus !== "All") {
      query = query.eq("delivery_status", String(req.query.deliveryStatus));
    }
    if (req.query.paymentStatus && req.query.paymentStatus !== "All") {
      query = query.eq("payment_status", String(req.query.paymentStatus));
    }
    const { data: orders, error } = await query;
    if (error) throw error;

    const series = new Map();
    const regions = new Map();
    const products = new Map();
    const customers = new Set();
    for (const order of orders || []) {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = series.get(key) || { period: key, revenue: 0, orders: 0 };
      bucket.revenue += Number(order.total);
      bucket.orders += 1;
      series.set(key, bucket);
      if (order.customer_id) customers.add(order.customer_id);
      const parts = String(order.shipping_address || "")
        .split(",")
        .map((part) => part.trim());
      const region = parts.at(-2) || "Unspecified";
      regions.set(region, (regions.get(region) || 0) + Number(order.total));
      for (const item of order.items || []) {
        const product = products.get(item.product_id) || {
          productId: item.product_id,
          name: item.product_name,
          units: 0,
          revenue: 0,
        };
        product.units += Number(item.quantity);
        product.revenue += Number(item.quantity) * Number(item.unit_price);
        products.set(item.product_id, product);
      }
    }

    const grossRevenue = (orders || []).reduce((sum, order) => sum + Number(order.total), 0);
    const refunds = (orders || []).filter(
      (order) => order.payment_status === "Refunded" || order.delivery_status === "Refunded",
    );
    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        grossRevenue,
        netRevenue: (orders || [])
          .filter((order) => !refunds.includes(order))
          .reduce((sum, order) => sum + Number(order.total), 0),
        orderCount: (orders || []).length,
        averageOrderValue: orders?.length ? grossRevenue / orders.length : 0,
        customerCount: customers.size,
        refundCount: refunds.length,
      },
      series: Array.from(series.values()),
      regions: Array.from(regions, ([region, sales]) => ({ region, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10),
      topProducts: Array.from(products.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      orders: orders || [],
    });
  } catch (error) {
    res.status(400).json({ error: safeErrorMessage(error, "Could not build the sales report.") });
  }
});

function shippingPayload(input) {
  const minimum = Math.max(0, Math.trunc(Number(input.estimatedDaysMin) || 0));
  const maximum = Math.max(minimum, Math.trunc(Number(input.estimatedDaysMax) || minimum));
  const code = String(input.code || input.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!String(input.name || "").trim() || !code) {
    throw publicError("Shipping name and code are required.");
  }
  return {
    name: String(input.name).trim(),
    code,
    rate: Math.max(0, Number(input.rate) || 0),
    free_threshold:
      input.freeThreshold === null || input.freeThreshold === ""
        ? null
        : Math.max(0, Number(input.freeThreshold) || 0),
    estimated_days_min: minimum,
    estimated_days_max: maximum,
    is_active: Boolean(input.isActive),
    sort_order: Math.trunc(Number(input.sortOrder) || 0),
  };
}

router.get("/shipping", requirePermission("shipping"), async (_req, res) => {
  const { data, error } = await supabase.from("shipping_methods").select("*").order("sort_order");
  if (error) return res.status(500).json({ error: "Could not load shipping methods." });
  res.json(data || []);
});

router.post("/shipping", requirePermission("shipping"), async (req, res) => {
  try {
    const payload = shippingPayload(req.body);
    const { data, error } = await supabase
      .from("shipping_methods")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    await logAction(req, "Shipping Method Created", payload.name);
    res.status(201).json(data);
  } catch (error) {
    res
      .status(400)
      .json({ error: safeErrorMessage(error, "Shipping method could not be created.") });
  }
});

router.patch("/shipping/:id", requirePermission("shipping"), async (req, res) => {
  try {
    const payload = shippingPayload(req.body);
    const { data, error } = await supabase
      .from("shipping_methods")
      .update(payload)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    await logAction(req, "Shipping Method Updated", payload.name);
    res.json(data);
  } catch (error) {
    res
      .status(400)
      .json({ error: safeErrorMessage(error, "Shipping method could not be updated.") });
  }
});

router.delete("/shipping/:id", requirePermission("shipping"), async (req, res) => {
  const { data, error } = await supabase
    .from("shipping_methods")
    .delete()
    .eq("id", req.params.id)
    .select("name")
    .single();
  if (error) return res.status(400).json({ error: "Shipping method could not be deleted." });
  await logAction(req, "Shipping Method Deleted", data.name);
  res.status(204).end();
});

router.get("/payments", requirePermission("payments"), async (_req, res) => {
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .eq("id", "razorpay")
    .single();
  if (error) return res.status(500).json({ error: "Could not load payment settings." });
  const credentialsConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
  );
  res.json({
    ...data,
    credentials_configured: credentialsConfigured,
    mode_matches_credentials:
      credentialsConfigured && keyMatchesMode(process.env.RAZORPAY_KEY_ID, data.test_mode),
    key_hint: process.env.RAZORPAY_KEY_ID ? `...${process.env.RAZORPAY_KEY_ID.slice(-4)}` : null,
  });
});

router.patch("/payments", requirePermission("payments"), async (req, res) => {
  const enabledMethods = [
    req.body.allowCards,
    req.body.allowUpi,
    req.body.allowNetbanking,
    req.body.allowWallets,
  ];
  if (req.body.isEnabled && !enabledMethods.some(Boolean)) {
    return res.status(400).json({ error: "Enable at least one payment method." });
  }
  const payload = {
    is_enabled: Boolean(req.body.isEnabled),
    test_mode: Boolean(req.body.testMode),
    allow_cards: Boolean(req.body.allowCards),
    allow_upi: Boolean(req.body.allowUpi),
    allow_netbanking: Boolean(req.body.allowNetbanking),
    allow_wallets: Boolean(req.body.allowWallets),
    automatic_capture: Boolean(req.body.automaticCapture),
    updated_by: req.user.id,
  };
  const { data, error } = await supabase
    .from("payment_settings")
    .update(payload)
    .eq("id", "razorpay")
    .select()
    .single();
  if (error) return res.status(400).json({ error: "Payment settings could not be updated." });
  await logAction(req, "Payment Settings Updated", "Razorpay checkout configuration");
  res.json(data);
});

router.patch("/memberships/:id", requirePermission("settings"), async (req, res) => {
  if (!["Owner", "Admin"].includes(req.admin.role)) {
    return res.status(403).json({ error: "Only Owners and Admins can change access." });
  }
  const roles = [
    "Owner",
    "Admin",
    "Manager",
    "Inventory Manager",
    "Order Manager",
    "Customer Support",
    "Marketing",
    "Editor",
  ];
  if (!roles.includes(req.body.role))
    return res.status(400).json({ error: "Choose a valid role." });
  if (
    req.params.id === req.user.id &&
    (req.body.isActive === false || req.body.role !== req.admin.role)
  ) {
    return res.status(400).json({ error: "You cannot change or deactivate your own membership." });
  }
  if (req.body.role === "Owner" && req.admin.role !== "Owner") {
    return res.status(403).json({ error: "Only the Owner can assign the Owner role." });
  }
  const { data, error } = await supabase
    .from("admin_users")
    .update({ role: req.body.role, is_active: Boolean(req.body.isActive), permissions: [] })
    .eq("user_id", req.params.id)
    .select("display_name, email, role, is_active")
    .single();
  if (error) return res.status(400).json({ error: "Admin access could not be updated." });
  await logAction(req, "Admin Access Updated", `${data.email}: ${data.role}`);
  res.json(data);
});

router.post("/memberships/invite", requirePermission("settings"), async (req, res) => {
  if (!["Owner", "Admin"].includes(req.admin.role)) {
    return res.status(403).json({ error: "Only Owners and Admins can invite administrators." });
  }
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const name = String(req.body.name || "").trim();
  const role = String(req.body.role || "Editor");
  const roles = [
    "Owner",
    "Admin",
    "Manager",
    "Inventory Manager",
    "Order Manager",
    "Customer Support",
    "Marketing",
    "Editor",
  ];
  if (!email.includes("@") || name.length < 2) {
    return res.status(400).json({ error: "Add a valid name and email address." });
  }
  if (!roles.includes(role) || (role === "Owner" && req.admin.role !== "Owner")) {
    return res.status(400).json({ error: "Choose a role you are allowed to assign." });
  }
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
  });
  if (error || !data.user) return res.status(400).json({ error: "Administrator invite failed." });
  const { error: membershipError } = await supabase.from("admin_users").upsert({
    user_id: data.user.id,
    display_name: name,
    email,
    role,
    permissions: [],
    is_active: true,
  });
  if (membershipError) {
    return res.status(400).json({ error: "Administrator membership could not be created." });
  }
  await logAction(req, "Admin Invited", `${email}: ${role}`);
  res.status(201).json({ id: data.user.id });
});

const BACKUP_TABLES = [
  "store_settings",
  "categories",
  "products",
  "product_variants",
  "product_images",
  "homepage_banners",
  "coupons",
  "reviews",
  "marketing_campaigns",
  "shipping_methods",
  "payment_settings",
];

async function captureBackupPayload() {
  const payload = {};
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    payload[table] = data || [];
  }
  return payload;
}

router.get(
  "/backups",
  requirePermission("settings"),
  requireAdminRole("Owner", "Admin"),
  async (_req, res) => {
    const { data, error } = await supabase
      .from("application_backups")
      .select("id, name, description, status, created_by, restored_at, created_at")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return res.status(500).json({ error: "Could not load application snapshots." });
    res.json(data || []);
  },
);

router.post(
  "/backups",
  requirePermission("settings"),
  requireAdminRole("Owner", "Admin"),
  async (req, res) => {
    try {
      const payload = await captureBackupPayload();
      const name = String(req.body.name || `Manual snapshot ${new Date().toISOString()}`).trim();
      const { data, error } = await supabase
        .from("application_backups")
        .insert({
          name: name.slice(0, 120),
          description: String(req.body.description || "")
            .trim()
            .slice(0, 500),
          payload,
          created_by: req.user.id,
        })
        .select("id, name, description, status, created_at")
        .single();
      if (error) throw error;
      await logAction(req, "Application Backup Created", data.name);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: "Could not create the snapshot." });
    }
  },
);

router.get(
  "/backups/:id/export",
  requirePermission("settings"),
  requireAdminRole("Owner", "Admin"),
  async (req, res) => {
    const { data, error } = await supabase
      .from("application_backups")
      .select("name, created_at, payload")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(404).json({ error: "Snapshot not found." });
    res.json({ name: data.name, createdAt: data.created_at, tables: data.payload });
  },
);

router.post(
  "/backups/:id/restore",
  requirePermission("settings"),
  requireAdminRole("Owner"),
  async (req, res) => {
    try {
      const { data: backup, error } = await supabase
        .from("application_backups")
        .select("name, payload")
        .eq("id", req.params.id)
        .single();
      if (error || !backup) throw publicError("Snapshot not found.", 404);
      if (req.body.confirmation !== backup.name) {
        return res
          .status(400)
          .json({ error: "Type the snapshot name exactly to confirm restore." });
      }
      if (!backup.payload || typeof backup.payload !== "object" || Array.isArray(backup.payload)) {
        throw publicError("This snapshot is invalid and cannot be restored.");
      }
      for (const table of BACKUP_TABLES) {
        if (!Array.isArray(backup.payload[table]) || backup.payload[table].length > 10000) {
          throw publicError("This snapshot is incomplete or exceeds the safe restore limit.");
        }
      }
      const safetyPayload = await captureBackupPayload();
      const { error: safetyError } = await supabase.from("application_backups").insert({
        name: `Pre-restore safety snapshot ${new Date().toISOString()}`,
        description: `Created before restoring ${backup.name}`,
        payload: safetyPayload,
        created_by: req.user.id,
      });
      if (safetyError) throw safetyError;
      for (const table of BACKUP_TABLES) {
        const rows = Array.isArray(backup.payload?.[table]) ? backup.payload[table] : [];
        if (rows.length) {
          const { error: restoreError } = await supabase.from(table).upsert(rows);
          if (restoreError) throw restoreError;
        }
      }
      await supabase
        .from("application_backups")
        .update({
          status: "Restored",
          restored_by: req.user.id,
          restored_at: new Date().toISOString(),
        })
        .eq("id", req.params.id);
      await logAction(req, "Application Backup Restored", backup.name);
      res.json({ restored: true });
    } catch (error) {
      await supabase
        .from("application_backups")
        .update({ status: "Failed" })
        .eq("id", req.params.id);
      res
        .status(error?.status || 400)
        .json({ error: safeErrorMessage(error, "Could not restore the snapshot.") });
    }
  },
);

module.exports = router;
