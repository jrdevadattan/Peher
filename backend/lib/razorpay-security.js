const crypto = require("crypto");

function verifyPaymentSignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(String(signature), "utf8");
  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function keyMatchesMode(keyId, testMode) {
  if (!keyId) return false;
  return testMode ? keyId.startsWith("rzp_test_") : keyId.startsWith("rzp_live_");
}

function checkoutDisplayConfig(settings) {
  const enabledMethods = [
    ["card", settings.allow_cards],
    ["upi", settings.allow_upi],
    ["netbanking", settings.allow_netbanking],
    ["wallet", settings.allow_wallets],
  ];
  const hide = enabledMethods
    .filter(([, enabled]) => !enabled)
    .map(([method]) => ({ method }));

  return {
    display: {
      hide,
      preferences: { show_default_blocks: true },
    },
  };
}

module.exports = { checkoutDisplayConfig, keyMatchesMode, verifyPaymentSignature };
