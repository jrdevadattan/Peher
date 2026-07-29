require("dotenv").config();
const crypto = require("crypto");
const supabase = require("../lib/supabase");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function remove(table, column, value) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw error;
}

async function run() {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const couponCode = `TEST_${suffix}`.toUpperCase();
  const productSlug = `coupon-concurrency-${suffix}`;
  const paymentOrderId = `test_order_${suffix}`;
  const paymentId = `test_payment_${suffix}`;
  let couponId;
  let productId;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .limit(1)
    .single();
  if (profileError) throw profileError;

  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        slug: productSlug,
        sku: `TEST-${suffix}`,
        name: "Coupon concurrency test product",
        description: "Temporary automated test record",
        short_description: "Temporary test",
        material: "Test",
        price: 1000,
        stock: 4,
        status: "Published",
      })
      .select("id")
      .single();
    if (productError) throw productError;
    productId = product.id;

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        size: "TEST",
        price: 1000,
        stock: 4,
        sku: `TEST-${suffix}-V`,
      })
      .select("id")
      .single();
    if (variantError) throw variantError;

    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .insert({
        code: couponCode,
        type: "Flat",
        value: 100,
        min_purchase: 0,
        usage_limit: 1,
        max_redemptions_per_customer: 1,
        status: "Active",
      })
      .select("id")
      .single();
    if (couponError) throw couponError;
    couponId = coupon.id;

    const rpcArgs = {
      p_customer_id: profile.id,
      p_customer_name: profile.full_name || "Concurrency Test",
      p_customer_email: profile.email || "test@peher.example",
      p_customer_phone: "9999999999",
      p_shipping_address: "Temporary test address",
      p_payment_order_id: paymentOrderId,
      p_payment_id: paymentId,
      p_items: [
        {
          product_id: product.id,
          variant_id: variant.id,
          product_name: "Coupon concurrency test product",
          sku: `TEST-${suffix}-V`,
          unit_price: 1000,
          quantity: 1,
          size: "TEST",
          image_path: null,
        },
      ],
      p_subtotal: 1000,
      p_shipping_cost: 0,
      p_tax_amount: 180,
      p_coupon_code: couponCode,
    };

    const [first, second] = await Promise.all([
      supabase.rpc("finalize_paid_order", rpcArgs),
      supabase.rpc("finalize_paid_order", rpcArgs),
    ]);
    if (first.error) throw first.error;
    if (second.error) throw second.error;

    const results = [first.data?.[0], second.data?.[0]];
    assert(results.every(Boolean), "Both idempotent requests must return an order.");
    assert(
      results[0].order_id === results[1].order_id,
      "Duplicate requests created different orders.",
    );
    assert(
      results.filter((result) => result.already_exists).length === 1,
      "Exactly one request must be recognized as the duplicate.",
    );

    const [
      { data: storedCoupon, error: storedCouponError },
      { count: redemptionCount, error: redemptionError },
      { count: orderCount, error: orderError },
      { data: storedProduct, error: storedProductError },
      { data: storedVariant, error: storedVariantError },
    ] = await Promise.all([
      supabase.from("coupons").select("usage_count").eq("id", coupon.id).single(),
      supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payment_order_id", paymentOrderId),
      supabase.from("products").select("stock").eq("id", product.id).single(),
      supabase.from("product_variants").select("stock").eq("id", variant.id).single(),
    ]);
    if (
      storedCouponError ||
      redemptionError ||
      orderError ||
      storedProductError ||
      storedVariantError
    ) {
      throw (
        storedCouponError ||
        redemptionError ||
        orderError ||
        storedProductError ||
        storedVariantError
      );
    }

    assert(storedCoupon.usage_count === 1, "Coupon usage count was incremented more than once.");
    assert(redemptionCount === 1, "More than one coupon redemption was stored.");
    assert(orderCount === 1, "More than one order was stored.");
    assert(storedProduct.stock === 3, "Product stock was decremented more than once.");
    assert(storedVariant.stock === 3, "Variant stock was decremented more than once.");
    assert(
      Number(results[0].order_total) === 900,
      "Tax-inclusive pricing added tax to the paid order a second time.",
    );

    process.stdout.write(
      "Coupon concurrency test passed: 1 order, 1 redemption, 1 stock change, tax included once.\n",
    );
  } finally {
    if (couponId) {
      await remove("coupon_redemptions", "coupon_id", couponId);
    }
    await remove("orders", "payment_order_id", paymentOrderId);
    if (couponId) {
      await remove("coupons", "id", couponId);
    }
    if (productId) {
      await remove("products", "id", productId);
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
