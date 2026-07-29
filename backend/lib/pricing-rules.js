function finiteMoney(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : fallback;
}

function calculateShippingCost(subtotal, { enabled, rate, freeThreshold }) {
  if (!enabled) return 0;
  const safeSubtotal = finiteMoney(subtotal);
  const safeRate = finiteMoney(rate);
  const safeThreshold = finiteMoney(freeThreshold, Number.MAX_SAFE_INTEGER);
  return safeSubtotal >= safeThreshold ? 0 : safeRate;
}

function calculateCheckoutTotal({
  subtotal,
  shippingCost,
  discountAmount,
  shippingDiscount,
}) {
  return Math.max(
    finiteMoney(subtotal) +
      finiteMoney(shippingCost) -
      finiteMoney(discountAmount) -
      finiteMoney(shippingDiscount),
    0,
  );
}

module.exports = { calculateCheckoutTotal, calculateShippingCost };
