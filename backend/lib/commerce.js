const supabase = require("./supabase");
const { publicError } = require("./http-error");

const MAX_CART_LINES = 50;
const MAX_QUANTITY_PER_LINE = 10;

function normalizeCouponCode(code) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) {
    throw publicError("Enter a valid coupon code.");
  }
  return normalized;
}

async function priceCart(items, customerId, couponCode) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_CART_LINES) {
    throw publicError("Your cart is empty or contains too many items.");
  }

  const normalizedItems = items.map((item) => {
    const slug = String(item.id || "").trim();
    const quantity = Number(item.qty);
    const size = item.size ? String(item.size).trim() : null;
    if (!slug || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw publicError("A cart item has an invalid quantity.");
    }
    return { slug, quantity, size };
  });

  const slugs = [...new Set(normalizedItems.map((item) => item.slug))];
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, slug, sku, name, price, stock, tax_rate, status, images:product_images(object_path, kind), variants:product_variants(id, size, price, stock, sku)",
    )
    .in("slug", slugs)
    .eq("status", "Published");
  if (error) throw error;
  if ((products || []).length !== slugs.length) {
    throw publicError("One or more products are unavailable.");
  }

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const pricedItems = normalizedItems.map((item) => {
    const product = bySlug.get(item.slug);
    const variant = item.size
      ? product?.variants?.find((candidate) => candidate.size === item.size)
      : null;
    const availableStock = variant ? Number(variant.stock) : Number(product?.stock);
    if (!product || item.quantity > availableStock) {
      throw publicError(`${product?.name || item.slug} is unavailable in the requested quantity.`);
    }
    if (item.size && !variant) {
      throw publicError(`The selected size for ${product.name} is unavailable.`);
    }
    const primaryImage = product.images?.find((image) => image.kind === "primary");
    return {
      product_id: product.id,
      variant_id: variant?.id || null,
      product_name: product.name,
      sku: variant?.sku || product.sku,
      unit_price: Number(variant?.price ?? product.price),
      quantity: item.quantity,
      size: item.size,
      image_path: primaryImage?.object_path || null,
      tax_rate: Number(product.tax_rate || 0),
    };
  });

  const subtotal = pricedItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const [
    { data: settings, error: settingsError },
    { data: shippingMethods, error: shippingError },
  ] = await Promise.all([
    supabase
      .from("store_settings")
      .select(
        "gst_percentage, prices_include_tax, shipping_enabled, standard_shipping_rate, free_shipping_threshold",
      )
      .eq("id", "default")
      .single(),
    supabase
      .from("shipping_methods")
      .select("rate, free_threshold")
      .eq("is_active", true)
      .order("sort_order")
      .limit(1),
  ]);
  if (settingsError) throw settingsError;
  if (shippingError) throw shippingError;

  const method = shippingMethods?.[0];
  const shippingRate = Number(method?.rate ?? settings.standard_shipping_rate ?? 0);
  const freeThreshold = Number(
    method?.free_threshold ?? settings.free_shipping_threshold ?? Number.MAX_SAFE_INTEGER,
  );
  const shippingCost = settings.shipping_enabled && subtotal < freeThreshold ? shippingRate : 0;
  const taxAmount = pricedItems.reduce((sum, item) => {
    const lineTotal = item.unit_price * item.quantity;
    const rate = Number(item.tax_rate || settings.gst_percentage || 0);
    if (!rate) return sum;
    return (
      sum +
      (settings.prices_include_tax
        ? lineTotal - lineTotal / (1 + rate / 100)
        : lineTotal * (rate / 100))
    );
  }, 0);
  const normalizedCode = normalizeCouponCode(couponCode);
  let coupon = null;
  let discountAmount = 0;
  let shippingDiscount = 0;

  if (normalizedCode) {
    const { data, error: couponError } = await supabase.rpc("validate_coupon_server", {
      p_code: normalizedCode,
      p_customer_id: customerId,
      p_subtotal: subtotal,
      p_shipping_cost: shippingCost,
    });
    if (couponError) {
      throw publicError(
        couponError.code === "P0001" ? couponError.message : "This coupon could not be validated.",
      );
    }
    const result = data?.[0];
    if (!result) throw publicError("This coupon could not be validated.");
    discountAmount = Number(result.discount_amount);
    shippingDiscount = Number(result.shipping_discount);
    coupon = {
      id: result.coupon_id,
      code: result.code,
      type: result.coupon_type,
      value: Number(result.coupon_value),
    };
  }

  const taxToAdd = settings.prices_include_tax ? 0 : taxAmount;
  const total = Math.max(subtotal + shippingCost + taxToAdd - discountAmount - shippingDiscount, 0);

  return {
    items: pricedItems,
    subtotal,
    shippingCost,
    taxAmount,
    discountAmount: discountAmount + shippingDiscount,
    total,
    coupon,
  };
}

module.exports = { normalizeCouponCode, priceCart };
