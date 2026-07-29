const express = require("express");
const { rateLimit } = require("express-rate-limit");
const requireAuth = require("../middleware/auth");
const supabase = require("../lib/supabase");
const { priceCart } = require("../lib/commerce");
const { safeErrorMessage } = require("../lib/http-error");

const router = express.Router();
const reviewLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many review attempts. Please try again later." },
});
const pricingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many pricing requests. Please try again shortly." },
});

router.post("/pricing", pricingLimiter, async (req, res) => {
  try {
    const pricing = await priceCart(req.body.items, null, null);
    res.json({
      subtotal: pricing.subtotal,
      shippingCost: pricing.shippingCost,
      taxAmount: pricing.taxAmount,
      discountAmount: pricing.discountAmount,
      total: pricing.total,
    });
  } catch (error) {
    res.status(400).json({
      error: safeErrorMessage(error, "Could not calculate cart pricing."),
    });
  }
});

const productSelect = `
  id, slug, sku, name, brand, subcategory, description, short_description,
  material, price, original_price, stock, weight, dimensions, tags,
  seo_title, seo_description, status, is_featured, is_trending, is_bestseller,
  badge, tax_rate, shipping_class, barcode, gtin, mpn, created_at,
  updated_at, category:categories(name, slug),
  images:product_images(id, bucket_id, object_path, kind, alt_text, sort_order),
  variants:product_variants(id, size, color, price, stock, sku, sort_order)
`;

router.get("/products", async (_req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("status", "Published")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load products" });
  res.json(data || []);
});

router.get("/products/:slug", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", req.params.slug)
    .eq("status", "Published")
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load this product" });
  if (!data) return res.status(404).json({ error: "Product not found" });
  res.json(data);
});

router.get("/categories", async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) return res.status(500).json({ error: "Could not load categories" });
  res.json(data || []);
});

router.get("/seo/pages", async (_req, res) => {
  const { data, error } = await supabase
    .from("seo_pages")
    .select(
      "id, path, title, description, include_in_sitemap, include_in_llms, is_indexable, sort_order, updated_at",
    )
    .eq("is_indexable", true)
    .order("sort_order")
    .order("path");
  if (error) return res.status(500).json({ error: "Could not load sitemap pages" });
  res.json(data || []);
});

router.get("/products/:productId/reviews", async (req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, customer_name, rating, title, comment, created_at, is_verified_purchase")
    .eq("product_id", req.params.productId)
    .eq("status", "Approved")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load reviews" });
  res.json(data || []);
});

router.post("/products/:productId/reviews", reviewLimiter, requireAuth, async (req, res) => {
  const rating = Number(req.body.rating);
  const title = String(req.body.title || "").trim();
  const comment = String(req.body.comment || "").trim();
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    title.length > 120 ||
    comment.length < 10 ||
    comment.length > 2000
  ) {
    return res.status(400).json({
      error: "Add a 1-5 rating, an optional title, and a review of 10-2,000 characters.",
    });
  }

  const [{ data: profile }, { data: deliveredOrder }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, status")
      .eq("id", req.user.id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("order:orders!inner(customer_id, payment_status, delivery_status)")
      .eq("product_id", req.params.productId)
      .eq("order.customer_id", req.user.id)
      .eq("order.payment_status", "Paid")
      .eq("order.delivery_status", "Delivered")
      .limit(1)
      .maybeSingle(),
  ]);
  if (!profile || profile.status !== "Active") {
    return res.status(403).json({ error: "Your customer profile is not active." });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: req.params.productId,
      customer_id: req.user.id,
      customer_name: profile.full_name || req.user.email.split("@")[0],
      customer_email: profile.email || req.user.email,
      rating,
      title: title || null,
      comment,
      status: "Pending",
      is_verified_purchase: Boolean(deliveredOrder),
    })
    .select("id")
    .single();
  if (error?.code === "23505") {
    return res.status(409).json({ error: "You have already reviewed this product." });
  }
  if (error) return res.status(400).json({ error: "Your review could not be submitted." });
  res.status(201).json({ id: data.id });
});

router.get("/settings", async (_req, res) => {
  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "store_name, tagline, contact_email, currency_code, gst_percentage, free_shipping_threshold, standard_shipping_rate, prices_include_tax, shipping_enabled, maintenance_mode, meta_title, meta_description, public_site_url",
    )
    .eq("id", "default")
    .single();
  if (error || !data) {
    return res.status(500).json({ error: "Storefront settings are not configured" });
  }
  res.json(data);
});

router.get("/banners", async (_req, res) => {
  const { data, error } = await supabase
    .from("homepage_banners")
    .select("id, title, subtitle, cta_label, cta_url, image_path, image_alt, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");
  if (error) return res.status(500).json({ error: "Could not load homepage banners" });
  res.json(data || []);
});

module.exports = router;
